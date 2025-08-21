import { globalShortcut, app } from "electron"
import { IShortcutsHelperDeps } from "./main"
import { configHelper } from "./ConfigHelper"

export class ShortcutsHelper {
  private deps: IShortcutsHelperDeps

  constructor(deps: IShortcutsHelperDeps) {
    this.deps = deps
  }

  private adjustOpacity(delta: number): void {
    const mainWindow = this.deps.getMainWindow();
    if (!mainWindow) return;
    
    let currentOpacity = mainWindow.getOpacity();
    let newOpacity = Math.max(0.1, Math.min(1.0, currentOpacity + delta));
    console.log(`Adjusting opacity from ${currentOpacity} to ${newOpacity}`);
    
    mainWindow.setOpacity(newOpacity);
    
    // Save the opacity setting to config without re-initializing the client
    try {
      const config = configHelper.loadConfig();
      config.opacity = newOpacity;
      configHelper.saveConfig(config);
    } catch (error) {
      console.error('Error saving opacity to config:', error);
    }
    
    // If we're making the window visible, also make sure it's shown and interaction is enabled
    if (newOpacity > 0.1 && !this.deps.isVisible()) {
      this.deps.toggleMainWindow();
    }
  }

  public registerGlobalShortcuts(): void {
    console.log("Registering global shortcuts...")
    
    const screenshotShortcutRegistered = globalShortcut.register("CommandOrControl+H", async () => {
      console.log("CommandOrControl+H pressed - attempting screenshot capture")
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        console.log("Main window found, taking screenshot...")
        try {
          const screenshotPath = await this.deps.takeScreenshot()
          console.log("Screenshot captured successfully:", screenshotPath)
          
          // Verify the file exists and has content
          const fs = require('fs')
          if (fs.existsSync(screenshotPath)) {
            const stats = fs.statSync(screenshotPath)
            console.log(`Screenshot file size: ${stats.size} bytes`)
            
            const preview = await this.deps.getImagePreview(screenshotPath)
            console.log("Preview generated, sending to renderer")
            mainWindow.webContents.send("screenshot-taken", {
              path: screenshotPath,
              preview
            })
          } else {
            console.error("Screenshot file was not created or doesn't exist")
            mainWindow.webContents.send("screenshot-error", "Screenshot file not found")
          }
        } catch (error) {
          console.error("Error capturing screenshot:", error)
          mainWindow.webContents.send("screenshot-error", error.message)
        }
      } else {
        console.error("No main window available for screenshot")
      }
    })
    
    if (screenshotShortcutRegistered) {
      console.log("Screenshot shortcut (Ctrl+H/Cmd+H) registered successfully")
    } else {
      console.error("Failed to register screenshot shortcut (Ctrl+H/Cmd+H) - may be in use by another app")
    }

    const processShortcutRegistered = globalShortcut.register("CommandOrControl+Enter", async () => {
      console.log("CommandOrControl+Enter pressed - starting processing...")
      try {
        // Keep recording continuous - don't stop for processing
        console.log("Processing while keeping audio recording continuous...")

        // Check if processing helper is available
        if (!this.deps.processingHelper) {
          console.error("Processing helper not available")
          return
        }
        
        // Send immediate feedback to UI
        const mainWindow = this.deps.getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("processing-status", {
            message: "Processing initiated via keyboard shortcut...",
            progress: 1
          });
        }
        
        await this.deps.processingHelper.processScreenshotsWithAudio()
        console.log("Processing completed successfully")
      } catch (error) {
        console.error("Error during processing:", error)
        
        // Send error feedback to UI
        const mainWindow = this.deps.getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("processing-error", {
            message: "Processing failed: " + (error?.message || "Unknown error")
          });
        }
      }
    })
    
    if (processShortcutRegistered) {
      console.log("Process shortcut (Ctrl+Enter) registered successfully")
    } else {
      console.error("Failed to register process shortcut (Ctrl+Enter)")
    }

    const resetShortcutRegistered = globalShortcut.register("CommandOrControl+R", async () => {
      console.log("CommandOrControl+R pressed. Resetting application state.");
      try {
        console.log("1. Canceling ongoing API requests...");
        this.deps.processingHelper?.cancelOngoingRequests();

        // Keep recording but clear old files
        console.log("2. Clearing old audio recordings but keeping current recording...");
        
        console.log("3. Clearing old audio recordings...");
        const clearResult = await this.deps.clearAudioRecordings();
        if (!clearResult.success) {
          console.error("Failed to clear audio recordings:", clearResult.error);
        }

        console.log("4. Clearing screenshot queues...");
        this.deps.clearQueues();

        console.log("5. Setting view to 'notes'...");
        this.deps.setView("queue");

        const mainWindow = this.deps.getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          console.log("6. Sending reset events to renderer...");
          mainWindow.webContents.send("reset-view");
          mainWindow.webContents.send("reset");
        }
        
        // Make sure recording is running after reset
        console.log("7. Ensuring audio recording continues after reset...");
        if (!this.deps.isRecordingAudio()) {
          setTimeout(async () => {
            try {
              const restartResult = await this.deps.startAudioRecording();
              if (restartResult.success) {
                console.log("Recording started after reset:", restartResult.id);
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("audio-recording-started", { id: restartResult.id, autoRestarted: true });
                }
              } else {
                console.error("Failed to start recording after reset:", restartResult.error);
              }
            } catch (error) {
              console.error("Error starting recording after reset:", error);
            }
          }, 1000); // Wait 1 second after reset
        } else {
          console.log("Recording already active, continuing...");
        }
        
        console.log("Reset process completed.");
      } catch (error) {
        console.error("An unexpected error occurred during reset:", error);
      }
    })

    // New shortcuts for moving the window
    globalShortcut.register("CommandOrControl+Left", () => {
      console.log("Command/Ctrl + Left pressed. Moving window left.")
      this.deps.moveWindowLeft()
    })

    globalShortcut.register("CommandOrControl+Right", () => {
      console.log("Command/Ctrl + Right pressed. Moving window right.")
      this.deps.moveWindowRight()
    })

    globalShortcut.register("CommandOrControl+Down", () => {
      console.log("Command/Ctrl + down pressed. Moving window down.")
      this.deps.moveWindowDown()
    })

    globalShortcut.register("CommandOrControl+Up", () => {
      console.log("Command/Ctrl + Up pressed. Moving window Up.")
      this.deps.moveWindowUp()
    })

    globalShortcut.register("CommandOrControl+B", () => {
      console.log("Command/Ctrl + B pressed. Toggling window visibility.")
      this.deps.toggleMainWindow()
    })

    globalShortcut.register("CommandOrControl+Q", () => {
      console.log("Command/Ctrl + Q pressed. Quitting application.")
      app.quit()
    })

    // Adjust opacity shortcuts
    globalShortcut.register("CommandOrControl+[", () => {
      console.log("Command/Ctrl + [ pressed. Decreasing opacity.")
      this.adjustOpacity(-0.1)
    })

    globalShortcut.register("CommandOrControl+]", () => {
      console.log("Command/Ctrl + ] pressed. Increasing opacity.")
      this.adjustOpacity(0.1)
    })
    
    // Zoom controls
    globalShortcut.register("CommandOrControl+-", () => {
      console.log("Command/Ctrl + - pressed. Zooming out.")
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        const currentZoom = mainWindow.webContents.getZoomLevel()
        mainWindow.webContents.setZoomLevel(currentZoom - 0.5)
      }
    })
    
    globalShortcut.register("CommandOrControl+0", () => {
      console.log("Command/Ctrl + 0 pressed. Resetting zoom.")
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        mainWindow.webContents.setZoomLevel(0)
      }
    })
    
    globalShortcut.register("CommandOrControl+=", () => {
      console.log("Command/Ctrl + = pressed. Zooming in.")
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        const currentZoom = mainWindow.webContents.getZoomLevel()
        mainWindow.webContents.setZoomLevel(currentZoom + 0.5)
      }
    })
    
    // Delete last screenshot shortcut
    globalShortcut.register("CommandOrControl+L", () => {
      console.log("Command/Ctrl + L pressed. Deleting last screenshot.")
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        // Send an event to the renderer to delete the last screenshot
        mainWindow.webContents.send("delete-last-screenshot")
      }
    })

    // Audio recording is now continuous - no manual stop shortcut needed
    // Ctrl+A removed to avoid accidental stopping of continuous recording

    
    // Unregister shortcuts when quitting
    app.on("will-quit", () => {
      globalShortcut.unregisterAll()
    })
  }
}
