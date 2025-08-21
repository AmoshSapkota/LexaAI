import React, { useEffect, useState } from "react"
import { useToast } from "../contexts/toast"

interface AudioRecording {
  id: string
  timestamp: number
  duration: number
  transcript?: string
  isTranscribing?: boolean
}

interface TeleprompterProps {
  isVisible: boolean
  onClose: () => void
}

const Teleprompter: React.FC<TeleprompterProps> = ({ isVisible, onClose }) => {
  const [recordings, setRecordings] = useState<AudioRecording[]>([])
  const [currentRecording, setCurrentRecording] = useState<AudioRecording | null>(null)
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (isVisible) {
      loadRecordings()
      checkRecordingStatus()
    }
  }, [isVisible])

  useEffect(() => {
    // Listen for recording events
    const cleanupRecordingStarted = window.electronAPI.onAudioRecordingStarted?.((data) => {
      setCurrentRecording(data)
      setIsRecording(true)
    })

    const cleanupRecordingStopped = window.electronAPI.onAudioRecordingStopped?.((data) => {
      setCurrentRecording(null)
      setIsRecording(false)
      loadRecordings() // Refresh the list
    })

    return () => {
      cleanupRecordingStarted?.()
      cleanupRecordingStopped?.()
    }
  }, [])

  const loadRecordings = async () => {
    try {
      const result = await window.electronAPI.getAudioRecordings()
      if (result.success) {
        setRecordings(result.recordings || [])
      }
    } catch (error) {
      console.error("Error loading recordings:", error)
    }
  }

  const checkRecordingStatus = async () => {
    try {
      const result = await window.electronAPI.isRecordingAudio()
      if (result.success) {
        setIsRecording(result.isRecording)
        
        if (result.isRecording) {
          const currentResult = await window.electronAPI.getCurrentAudioRecording()
          if (currentResult.success && currentResult.recording) {
            setCurrentRecording(currentResult.recording)
          }
        }
      }
    } catch (error) {
      console.error("Error checking recording status:", error)
    }
  }

  const handleTranscribe = async (recordingId: string) => {
    try {
      // Update UI to show transcribing
      setRecordings(prev => prev.map(rec => 
        rec.id === recordingId 
          ? { ...rec, isTranscribing: true }
          : rec
      ))

      const result = await window.electronAPI.transcribeAudio(recordingId)
      
      if (result.success) {
        // Update the recording with transcript
        setRecordings(prev => prev.map(rec => 
          rec.id === recordingId 
            ? { ...rec, transcript: result.transcript, isTranscribing: false }
            : rec
        ))
        showToast("Transcription completed", "success")
      } else {
        setRecordings(prev => prev.map(rec => 
          rec.id === recordingId 
            ? { ...rec, isTranscribing: false }
            : rec
        ))
        showToast("Transcription failed: " + (result.error || "Unknown error"), "error")
      }
    } catch (error) {
      setRecordings(prev => prev.map(rec => 
        rec.id === recordingId 
          ? { ...rec, isTranscribing: false }
          : rec
      ))
      console.error("Error transcribing audio:", error)
      showToast("Failed to transcribe audio", "error")
    }
  }

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      const result = await window.electronAPI.deleteAudioRecording(recordingId)
      if (result.success) {
        setRecordings(prev => prev.filter(rec => rec.id !== recordingId))
        if (selectedRecording === recordingId) {
          setSelectedRecording(null)
        }
        showToast("Recording deleted", "success")
      } else {
        showToast("Failed to delete recording", "error")
      }
    } catch (error) {
      console.error("Error deleting recording:", error)
      showToast("Failed to delete recording", "error")
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Audio Teleprompter</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Recording List */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold mb-2">Recordings</h3>
              {isRecording && currentRecording && (
                <div className="bg-red-900 p-2 rounded mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Recording...</span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    Started: {formatTimestamp(currentRecording.timestamp)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-auto">
              {recordings.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>No recordings available</p>
                  <p className="text-sm mt-2">Audio recordings will appear here</p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {recordings.map((recording) => (
                    <div
                      key={recording.id}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        selectedRecording === recording.id
                          ? 'bg-blue-600'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedRecording(recording.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            Recording {recording.id.slice(0, 8)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatTimestamp(recording.timestamp)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Duration: {formatDuration(recording.duration)}
                          </div>
                          {recording.transcript && (
                            <div className="text-xs text-green-400 mt-1">
                              ✓ Transcribed
                            </div>
                          )}
                          {recording.isTranscribing && (
                            <div className="text-xs text-yellow-400 mt-1">
                              ⏳ Transcribing...
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRecording(recording.id)
                          }}
                          className="text-red-400 hover:text-red-300 text-sm"
                          title="Delete recording"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Transcript Display */}
          <div className="flex-1 flex flex-col">
            {selectedRecording ? (
              (() => {
                const recording = recordings.find(r => r.id === selectedRecording)
                if (!recording) return null

                return (
                  <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">
                          Recording {recording.id.slice(0, 8)}
                        </h3>
                        {!recording.transcript && !recording.isTranscribing && (
                          <button
                            onClick={() => handleTranscribe(recording.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                          >
                            Transcribe
                          </button>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {formatTimestamp(recording.timestamp)} • {formatDuration(recording.duration)}
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-auto">
                      {recording.isTranscribing ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p className="text-gray-400">Transcribing audio...</p>
                          </div>
                        </div>
                      ) : recording.transcript ? (
                        <div className="space-y-4">
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="font-medium mb-2 text-blue-400">Transcript</h4>
                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {recording.transcript}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-gray-500">
                            <p>No transcript available</p>
                            <p className="text-sm mt-2">Click "Transcribe" to generate transcript</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg">Select a recording</p>
                  <p className="text-sm mt-2">Choose a recording from the left to view its transcript</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Teleprompter