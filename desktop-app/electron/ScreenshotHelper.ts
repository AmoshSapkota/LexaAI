// ScreenshotHelper.ts

import path from "node:path";
import fs from "node:fs";
import { app } from "electron";
import { v4 as uuidv4 } from "uuid";
import { execFile } from "child_process";
import { promisify } from "util";
import screenshot from "screenshot-desktop";
import os from "os";

const execFileAsync = promisify(execFile);

export class ScreenshotHelper {
  private screenshotQueue: string[] = [];
  private extraScreenshotQueue: string[] = [];
  private readonly MAX_SCREENSHOTS = 5;

  private readonly screenshotDir: string;
  private readonly extraScreenshotDir: string;
  private readonly tempDir: string;

  private view: "queue" | "solutions" | "debug" = "queue";

  constructor(view: "queue" | "solutions" | "debug" = "queue") {
    this.view = view;

    // Initialize directories
    this.screenshotDir = path.join(app.getPath("userData"), "screenshots");
    this.extraScreenshotDir = path.join(
      app.getPath("userData"),
      "extra_screenshots"
    );
    this.tempDir = path.join(
      app.getPath("temp"),
      "lexaai-screenshots"
    );

    // Create directories if they don't exist
    this.ensureDirectoriesExist();

    // Clean existing screenshot directories when starting the app to start fresh
    this.cleanScreenshotDirectories();
  }

  private ensureDirectoriesExist(): void {
    const directories = [
      this.screenshotDir,
      this.extraScreenshotDir,
      this.tempDir,
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created directory: ${dir}`);
        } catch (err) {
          console.error(`Error creating directory ${dir}:`, err);
        }
      }
    }
  }

  // Load existing screenshots from directories on startup
  private loadExistingScreenshots(): void {
    try {
      // Load main screenshots
      if (fs.existsSync(this.screenshotDir)) {
        const files = fs
          .readdirSync(this.screenshotDir)
          .filter((file) => file.endsWith(".png"))
          .map((file) => path.join(this.screenshotDir, file))
          .sort((a, b) => {
            const statA = fs.statSync(a);
            const statB = fs.statSync(b);
            return statA.mtime.getTime() - statB.mtime.getTime(); // Sort by creation time
          })
          .slice(-this.MAX_SCREENSHOTS); // Keep only the latest screenshots
        
        this.screenshotQueue = files;
        console.log(`Loaded ${files.length} existing screenshots from main queue`);
      }

      // Load extra screenshots
      if (fs.existsSync(this.extraScreenshotDir)) {
        const files = fs
          .readdirSync(this.extraScreenshotDir)
          .filter((file) => file.endsWith(".png"))
          .map((file) => path.join(this.extraScreenshotDir, file))
          .sort((a, b) => {
            const statA = fs.statSync(a);
            const statB = fs.statSync(b);
            return statA.mtime.getTime() - statB.mtime.getTime(); // Sort by creation time
          })
          .slice(-this.MAX_SCREENSHOTS); // Keep only the latest screenshots
        
        this.extraScreenshotQueue = files;
        console.log(`Loaded ${files.length} existing screenshots from extra queue`);
      }
    } catch (err) {
      console.error("Error loading existing screenshots:", err);
    }
  }

  // This method replaces loadExistingScreenshots() to ensure we start with empty queues
  private cleanScreenshotDirectories(): void {
    try {
      // Clean main screenshots directory
      if (fs.existsSync(this.screenshotDir)) {
        const files = fs
          .readdirSync(this.screenshotDir)
          .filter((file) => file.endsWith(".png"))
          .map((file) => path.join(this.screenshotDir, file));

        // Delete each screenshot file
        for (const file of files) {
          try {
            fs.unlinkSync(file);
            console.log(`Deleted existing screenshot: ${file}`);
          } catch (err) {
            console.error(`Error deleting screenshot ${file}:`, err);
          }
        }
      }

      // Clean extra screenshots directory
      if (fs.existsSync(this.extraScreenshotDir)) {
        const files = fs
          .readdirSync(this.extraScreenshotDir)
          .filter((file) => file.endsWith(".png"))
          .map((file) => path.join(this.extraScreenshotDir, file));

        // Delete each screenshot file
        for (const file of files) {
          try {
            fs.unlinkSync(file);
            console.log(`Deleted existing extra screenshot: ${file}`);
          } catch (err) {
            console.error(`Error deleting extra screenshot ${file}:`, err);
          }
        }
      }

      console.log("Screenshot directories cleaned successfully");
    } catch (err) {
      console.error("Error cleaning screenshot directories:", err);
    }
  }

  public getView(): "queue" | "solutions" | "debug" {
    return this.view;
  }

  public setView(view: "queue" | "solutions" | "debug"): void {
    console.log("Setting view in ScreenshotHelper:", view);
    console.log(
      "Current queues - Main:",
      this.screenshotQueue,
      "Extra:",
      this.extraScreenshotQueue
    );
    this.view = view;
  }

  public getScreenshotQueue(): string[] {
    return this.screenshotQueue;
  }

  public getExtraScreenshotQueue(): string[] {
    console.log("Getting extra screenshot queue:", this.extraScreenshotQueue);
    return this.extraScreenshotQueue;
  }

  public clearQueues(): void {
    console.log("Clearing screenshot queues manually...");
    // Clear screenshotQueue
    this.screenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err)
          console.error(`Error deleting screenshot at ${screenshotPath}:`, err);
      });
    });
    this.screenshotQueue = [];

    // Clear extraScreenshotQueue
    this.extraScreenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err)
          console.error(
            `Error deleting extra screenshot at ${screenshotPath}:`,
            err
          );
      });
    });
    this.extraScreenshotQueue = [];
    console.log("Screenshot queues cleared");
  }

  private async captureScreenshot(): Promise<Buffer> {
    try {
      console.log("Starting screenshot capture...");

      // For Windows, try to fix PATH issue by setting environment
      if (process.platform === "win32") {
        const originalPath = process.env.PATH;
        // Add common Windows paths that might contain cmd.exe
        process.env.PATH = `${originalPath};C:\\Windows\\System32;C:\\Windows;C:\\Windows\\System32\\Wbem`;
        
        try {
          const buffer = await screenshot({ format: "png" });
          
          if (!buffer || buffer.length === 0) {
            throw new Error("Screenshot capture returned empty buffer");
          }
          
          console.log(`Screenshot captured successfully, size: ${buffer.length} bytes`);
          return buffer;
        } finally {
          // Restore original PATH
          process.env.PATH = originalPath;
        }
      } else {
        // For non-Windows platforms
        const buffer = await screenshot({ format: "png" });
        
        if (!buffer || buffer.length === 0) {
          throw new Error("Screenshot capture returned empty buffer");
        }
        
        console.log(`Screenshot captured successfully, size: ${buffer.length} bytes`);
        return buffer;
      }
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      throw new Error(`Failed to capture screenshot: ${error.message}`);
    }
  }


  public async takeScreenshot(
    hideMainWindow: () => void,
    showMainWindow: () => void
  ): Promise<string> {
    console.log("Taking screenshot in view:", this.view);
    console.log("Screenshot directory:", this.screenshotDir);
    console.log("Extra screenshot directory:", this.extraScreenshotDir);
    
    let screenshotPath = "";
    
    try {
      // Hide window first
      hideMainWindow();
      console.log("Window hidden, waiting for settle time...");

      // Simple delay for window hiding 
      const hideDelay = 300;
      await new Promise((resolve) => setTimeout(resolve, hideDelay));

      console.log("Starting screenshot capture...");
      // Get screenshot buffer using cross-platform method
      const screenshotBuffer = await this.captureScreenshot();

      if (!screenshotBuffer || screenshotBuffer.length === 0) {
        throw new Error("Screenshot capture returned empty buffer");
      }

      console.log(`Screenshot buffer captured: ${screenshotBuffer.length} bytes`);

      // Save and manage the screenshot based on current view
      if (this.view === "queue") {
        screenshotPath = path.join(this.screenshotDir, `${uuidv4()}.png`);
        const screenshotDir = path.dirname(screenshotPath);
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
          console.log("Created screenshot directory:", screenshotDir);
        }
        await fs.promises.writeFile(screenshotPath, screenshotBuffer);
        console.log("Screenshot saved to:", screenshotPath);
        
        // Verify file was written
        if (fs.existsSync(screenshotPath)) {
          const stats = fs.statSync(screenshotPath);
          console.log(`Screenshot file verified: ${stats.size} bytes`);
        } else {
          throw new Error("Screenshot file was not written to disk");
        }
        
        console.log("Adding screenshot to main queue:", screenshotPath);
        this.screenshotQueue.push(screenshotPath);
        if (this.screenshotQueue.length > this.MAX_SCREENSHOTS) {
          const removedPath = this.screenshotQueue.shift();
          if (removedPath) {
            try {
              await fs.promises.unlink(removedPath);
              console.log(
                "Removed old screenshot from main queue:",
                removedPath
              );
            } catch (error) {
              console.error("Error removing old screenshot:", error);
            }
          }
        }
      } else {
        // In solutions view, only add to extra queue
        screenshotPath = path.join(this.extraScreenshotDir, `${uuidv4()}.png`);
        const screenshotDir = path.dirname(screenshotPath);
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
          console.log("Created extra screenshot directory:", screenshotDir);
        }
        await fs.promises.writeFile(screenshotPath, screenshotBuffer);
        console.log("Screenshot saved to:", screenshotPath);
        
        // Verify file was written
        if (fs.existsSync(screenshotPath)) {
          const stats = fs.statSync(screenshotPath);
          console.log(`Extra screenshot file verified: ${stats.size} bytes`);
        } else {
          throw new Error("Extra screenshot file was not written to disk");
        }
        
        console.log("Adding screenshot to extra queue:", screenshotPath);
        this.extraScreenshotQueue.push(screenshotPath);
        if (this.extraScreenshotQueue.length > this.MAX_SCREENSHOTS) {
          const removedPath = this.extraScreenshotQueue.shift();
          if (removedPath) {
            try {
              await fs.promises.unlink(removedPath);
              console.log(
                "Removed old screenshot from extra queue:",
                removedPath
              );
            } catch (error) {
              console.error("Error removing old screenshot:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Screenshot error:", error);
      throw error;
    } finally {
      // Increased delay for showing window again
      console.log("Showing window again...");
      await new Promise((resolve) => setTimeout(resolve, 300));
      showMainWindow();
    }

    console.log("Screenshot process completed, returning path:", screenshotPath);
    return screenshotPath;
  }

  public async getImagePreview(filepath: string): Promise<string> {
    try {
      if (!fs.existsSync(filepath)) {
        console.error(`Image file not found: ${filepath}`);
        return "";
      }

      const data = await fs.promises.readFile(filepath);
      return `data:image/png;base64,${data.toString("base64")}`;
    } catch (error) {
      console.error("Error reading image:", error);
      return "";
    }
  }

  public async deleteScreenshot(
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (fs.existsSync(path)) {
        await fs.promises.unlink(path);
      }

      if (this.view === "queue") {
        this.screenshotQueue = this.screenshotQueue.filter(
          (filePath) => filePath !== path
        );
      } else {
        this.extraScreenshotQueue = this.extraScreenshotQueue.filter(
          (filePath) => filePath !== path
        );
      }
      return { success: true };
    } catch (error) {
      console.error("Error deleting file:", error);
      return { success: false, error: error.message };
    }
  }

  public clearExtraScreenshotQueue(): void {
    // Clear extraScreenshotQueue
    this.extraScreenshotQueue.forEach((screenshotPath) => {
      if (fs.existsSync(screenshotPath)) {
        fs.unlink(screenshotPath, (err) => {
          if (err)
            console.error(
              `Error deleting extra screenshot at ${screenshotPath}:`,
              err
            );
        });
      }
    });
    this.extraScreenshotQueue = [];
  }
}
