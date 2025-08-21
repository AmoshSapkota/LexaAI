import React from "react"

interface Screenshot {
  id: string
  path: string
  preview: string
  timestamp: number
}

interface ScreenshotQueueProps {
  screenshots: Screenshot[]
  onDeleteScreenshot: (path: string) => void
  currentLanguage: string
  setLanguage: (language: string) => void
}

const ScreenshotQueue: React.FC<ScreenshotQueueProps> = ({
  screenshots,
  onDeleteScreenshot,
  currentLanguage,
  setLanguage
}) => {
  if (screenshots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No content captured yet</p>
        <p className="text-xs mt-1">Press Ctrl+H (or Cmd+H) to capture screenshots</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {screenshots.map((screenshot, index) => (
          <div
            key={screenshot.id}
            className="relative group bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
          >
            <div className="flex gap-3">
              {/* Screenshot Preview */}
              <div className="flex-shrink-0">
                <img
                  src={`data:image/png;base64,${screenshot.preview}`}
                  alt={`Screenshot ${index + 1}`}
                  className="w-16 h-12 object-cover rounded border border-white/10"
                />
              </div>
              
              {/* Screenshot Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      Content {index + 1}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(screenshot.timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteScreenshot(screenshot.path)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-sm"
                  >
                    ×
                  </button>
                </div>
                
                {/* File Path */}
                <p className="text-xs text-gray-500 mt-2 truncate">
                  {screenshot.path}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScreenshotQueue