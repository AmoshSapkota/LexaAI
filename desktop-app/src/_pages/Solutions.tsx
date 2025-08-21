import React, { useEffect, useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface SolutionData {
  explanation?: string
  code?: string
  language?: string
  complexity?: string
  approach?: string
  time_complexity?: string
  space_complexity?: string
}

const Solutions: React.FC = () => {
  const [solution, setSolution] = useState<SolutionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Listen for solution events from electron
  useEffect(() => {
    const cleanupSolutionSuccess = window.electronAPI.onSolutionSuccess((data) => {
      console.log("Solution received:", data)
      setSolution(data)
      setIsLoading(false)
      setError(null)
    })

    const cleanupSolutionError = window.electronAPI.onSolutionError((error) => {
      console.error("Solution error:", error)
      setError(error.message || "Failed to generate solution")
      setIsLoading(false)
    })

    const cleanupProcessingStatus = window.electronAPI.onProcessingStatus((status) => {
      console.log("Processing status:", status)
      if (status.message?.includes("Processing")) {
        setIsLoading(true)
        setError(null)
      }
    })

    const cleanupReset = window.electronAPI.onReset(() => {
      setSolution(null)
      setIsLoading(false)
      setError(null)
    })

    return () => {
      cleanupSolutionSuccess()
      cleanupSolutionError()
      cleanupProcessingStatus()
      cleanupReset()
    }
  }, [])

  const handleGoBack = () => {
    // This would typically trigger going back to queue view
    setSolution(null)
    setError(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Analyzing screenshots...</p>
          <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!solution) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">No Solution Available</h2>
          <p className="text-gray-400 mb-4">Capture screenshots and process them to see solutions here</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Go to Queue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-lg font-semibold">AI Solution</h1>
        <button
          onClick={handleGoBack}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
        >
          Back to Queue
        </button>
      </div>

      {/* Solution Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {solution.explanation && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-blue-400">Explanation</h2>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {solution.explanation}
              </p>
            </div>
          </div>
        )}

        {solution.approach && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-green-400">Approach</h2>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {solution.approach}
              </p>
            </div>
          </div>
        )}

        {solution.code && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-yellow-400">Code Solution</h2>
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <SyntaxHighlighter
                language={solution.language || "javascript"}
                style={oneDark}
                customStyle={{
                  margin: 0,
                  borderRadius: "0.5rem",
                  fontSize: "14px"
                }}
              >
                {solution.code}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {(solution.time_complexity || solution.space_complexity || solution.complexity) && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-purple-400">Complexity Analysis</h2>
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              {solution.time_complexity && (
                <div>
                  <span className="text-gray-400 font-medium">Time Complexity:</span>
                  <span className="ml-2 text-gray-300">{solution.time_complexity}</span>
                </div>
              )}
              {solution.space_complexity && (
                <div>
                  <span className="text-gray-400 font-medium">Space Complexity:</span>
                  <span className="ml-2 text-gray-300">{solution.space_complexity}</span>
                </div>
              )}
              {solution.complexity && (
                <div>
                  <span className="text-gray-400 font-medium">Overall Complexity:</span>
                  <span className="ml-2 text-gray-300">{solution.complexity}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Solutions