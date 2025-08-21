import React, { useEffect, useState } from "react"
import { useToast } from "../contexts/toast"
import Teleprompter from "../components/Teleprompter"

interface ScreenshotPreview {
  path: string
  preview: string
}

const Queue: React.FC = () => {
  const [screenshots, setScreenshots] = useState<ScreenshotPreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showTeleprompter, setShowTeleprompter] = useState(false)
  const { showToast } = useToast()

  // Load screenshots when component mounts
  useEffect(() => {
    loadScreenshots()
  }, [])

  // Listen for screenshot events
  useEffect(() => {
    const cleanupScreenshotTaken = window.electronAPI.onScreenshotTaken((data) => {
      console.log("Screenshot taken:", data)
      setScreenshots(prev => [...prev, data])
    })

    const cleanupScreenshotDeleted = window.electronAPI.onScreenshotDeleted((data) => {
      console.log("Screenshot deleted:", data)
      setScreenshots(prev => prev.filter(s => s.path !== data.path))
    })

    return () => {
      cleanupScreenshotTaken()
      cleanupScreenshotDeleted()
    }
  }, [])

  const loadScreenshots = async () => {
    try {
      const response = await window.electronAPI.getScreenshots()
      setScreenshots(response || [])
    } catch (error) {
      console.error("Error loading screenshots:", error)
    }
  }

  const handleDeleteScreenshot = async (path: string) => {
    try {
      await window.electronAPI.deleteScreenshot(path)
      setScreenshots(prev => prev.filter(s => s.path !== path))
      showToast("Screenshot deleted", "success")
    } catch (error) {
      console.error("Error deleting screenshot:", error)
      showToast("Failed to delete screenshot", "error")
    }
  }

  const handleProcessScreenshots = async () => {
    if (screenshots.length === 0) {
      showToast("No screenshots to process", "error")
      return
    }

    setIsLoading(true)
    try {
      await window.electronAPI.triggerProcessScreenshots()
      showToast("Processing started", "success")
    } catch (error) {
      console.error("Error processing screenshots:", error)
      showToast("Failed to start processing", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTakeScreenshot = async () => {
    try {
      const result = await window.electronAPI.triggerScreenshot()
      if (result.success) {
        showToast("Screenshot captured", "success")
      } else {
        showToast(result.error || "Failed to capture screenshot", "error")
      }
    } catch (error) {
      console.error("Error taking screenshot:", error)
      showToast("Failed to capture screenshot", "error")
    }
  }

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-lg font-semibold">Screenshot Queue</h1>
        <div className="flex gap-2">
          <button
            onClick={handleTakeScreenshot}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            Capture (Ctrl+H)
          </button>
          <button
            onClick={handleProcessScreenshots}
            disabled={isLoading || screenshots.length === 0}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
          >
            {isLoading ? "Processing..." : "Process (Ctrl+Enter)"}
          </button>
          <button
            onClick={() => setShowTeleprompter(true)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
          >
            Teleprompter
          </button>
        </div>
      </div>

      {/* Screenshots Grid */}
      <div className="flex-1 overflow-auto p-4">
        {screenshots.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No screenshots captured</p>
              <p className="text-sm">Press Ctrl+H to capture a screenshot</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {screenshots.map((screenshot, index) => (
              <div key={screenshot.path} className="relative group">
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={screenshot.preview}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => handleDeleteScreenshot(screenshot.path)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete screenshot"
                >
                  ×
                </button>
                <div className="mt-2 text-xs text-gray-400 truncate">
                  Screenshot {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teleprompter Modal */}
      <Teleprompter 
        isVisible={showTeleprompter} 
        onClose={() => setShowTeleprompter(false)} 
      />
    </div>
  )
}

export default Queue