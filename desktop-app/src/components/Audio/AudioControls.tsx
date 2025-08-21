import { useState, useEffect } from "react"

interface AudioRecording {
  id: string;
  filePath: string;
  duration: number;
  timestamp: number;
}

export default function AudioControls() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<AudioRecording[]>([])
  const [currentRecording, setCurrentRecording] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [transcriptionStatus, setTranscriptionStatus] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)

  // Check recording status on mount
  useEffect(() => {
    checkRecordingStatus()
    loadRecordings()
    
    // Set up interval to update recording duration
    const interval = setInterval(() => {
      if (isRecording) {
        getCurrentRecording()
      }
    }, 1000)

    // Listen for keyboard shortcut events
    const cleanupAudioStarted = window.electronAPI.onAudioRecordingStarted((data) => {
      setIsRecording(true)
      setError(null)
      updateProcessingStatus(recordings) // Update status to show auto-stop behavior
      
      if (data.autoStarted) {
        console.log('Auto-recording started on app launch:', data.id)
      } else if (data.autoRestarted) {
        console.log('Auto-recording restarted after processing/reset:', data.id)
      } else {
        console.log('Audio recording started via shortcut:', data.id)
      }
    })

    const cleanupAudioStopped = window.electronAPI.onAudioRecordingStopped((recording) => {
      setIsRecording(false)
      setCurrentRecording(null)
      setRecordingDuration(0)
      setError(null)
      loadRecordings() // This will call updateProcessingStatus with latest recordings
      console.log('Audio recording stopped via shortcut:', recording)
    })

    const cleanupAudioError = window.electronAPI.onAudioError((error) => {
      setError(error)
      console.error('Audio error from shortcut:', error)
    })

    return () => {
      clearInterval(interval)
      cleanupAudioStarted()
      cleanupAudioStopped()
      cleanupAudioError()
    }
  }, [isRecording, recordings])

  const checkRecordingStatus = async () => {
    try {
      const result = await window.electronAPI.isRecordingAudio()
      if (result.success) {
        setIsRecording(result.isRecording || false)
        if (result.isRecording) {
          getCurrentRecording()
        }
      }
    } catch (err) {
      console.error('Error checking recording status:', err)
    }
  }

  const getCurrentRecording = async () => {
    try {
      const result = await window.electronAPI.getCurrentAudioRecording()
      if (result.success && result.recording) {
        setCurrentRecording(result.recording)
        setRecordingDuration(Math.floor(result.recording.duration / 1000))
      }
    } catch (err) {
      console.error('Error getting current recording:', err)
    }
  }

  const loadRecordings = async () => {
    try {
      const result = await window.electronAPI.getAudioRecordings()
      if (result.success) {
        const recordings = result.recordings || []
        setRecordings(recordings)
        
        // Update processing status based on recent recordings
        updateProcessingStatus(recordings)
      }
    } catch (err) {
      console.error('Error loading recordings:', err)
    }
  }

  const updateProcessingStatus = (recordings: AudioRecording[]) => {
    // Check if currently recording
    if (isRecording) {
      setProcessingStatus('⌘+Enter will generate speaking prompts with audio context (recording continues)')
      return
    }
    
    if (recordings.length > 0) {
      const mostRecent = recordings[0]
      const age = Date.now() - mostRecent.timestamp
      const ageMinutes = Math.floor(age / 60000)
      
      if (age <= 10 * 60 * 1000) { // 10 minutes
        setProcessingStatus(`⌘+Enter will use audio from ${ageMinutes}min ago`)
      } else {
        setProcessingStatus(`Recent audio is too old (${ageMinutes}min) - will use screenshots only`)
      }
    } else {
      setProcessingStatus('⌘+Enter will process screenshots only (no audio available)')
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      const result = await window.electronAPI.startAudioRecording()
      if (result.success) {
        setIsRecording(true)
        setRecordingDuration(0)
        updateProcessingStatus(recordings) // Update status to show auto-stop behavior
        console.log('Recording started with ID:', result.id)
      } else {
        setError(result.error || 'Failed to start recording')
      }
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to start recording')
    }
  }

  const stopRecording = async () => {
    try {
      setError(null)
      const result = await window.electronAPI.stopAudioRecording()
      if (result.success) {
        setIsRecording(false)
        setCurrentRecording(null)
        setRecordingDuration(0)
        await loadRecordings() // Refresh the recordings list and update status
        console.log('Recording stopped:', result.recording)
      } else {
        setError(result.error || 'Failed to stop recording')
      }
    } catch (err) {
      console.error('Error stopping recording:', err)
      setError('Failed to stop recording')
    }
  }

  const deleteRecording = async (id: string) => {
    try {
      setError(null)
      const result = await window.electronAPI.deleteAudioRecording(id)
      if (result.success) {
        await loadRecordings() // Refresh the recordings list
        console.log('Recording deleted:', id)
      } else {
        setError(result.error || 'Failed to delete recording')
      }
    } catch (err) {
      console.error('Error deleting recording:', err)
      setError('Failed to delete recording')
    }
  }

  const clearAllRecordings = async () => {
    try {
      setError(null)
      const result = await window.electronAPI.clearAudioRecordings()
      if (result.success) {
        setRecordings([])
        console.log('All recordings cleared')
      } else {
        setError(result.error || 'Failed to clear recordings')
      }
    } catch (err) {
      console.error('Error clearing recordings:', err)
      setError('Failed to clear recordings')
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const transcribeRecording = async (recordingId: string) => {
    try {
      setError(null)
      const result = await window.electronAPI.transcribeAudio(recordingId)
      if (result.success) {
        console.log('Transcription:', result.transcript)
        // You could show the transcript in a modal or save it somewhere
        alert(`Transcription:\n\n${result.transcript}`)
      } else {
        setError(result.error || 'Failed to transcribe audio')
      }
    } catch (err) {
      console.error('Error transcribing audio:', err)
      setError('Failed to transcribe audio')
    }
  }

  const processWithAudio = async (recordingId: string) => {
    try {
      setError(null)
      const result = await window.electronAPI.processWithAudioTranscript(recordingId)
      if (result.success) {
        console.log('Processed with audio:', result.data)
        // The processing should automatically switch to solutions view
      } else {
        setError(result.error || 'Failed to process with audio')
      }
    } catch (err) {
      console.error('Error processing with audio:', err)
      setError('Failed to process with audio')
    }
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-medium">Practice Recording</h3>
        {isRecording && (
          <div className="flex items-center gap-2 text-red-400">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-xs">{formatDuration(recordingDuration * 1000)}</span>
          </div>
        )}
      </div>

      {/* Transcription Status Info */}
      {transcriptionStatus && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-400">{transcriptionStatus}</p>
        </div>
      )}

      {/* Processing Status Info */}
      {processingStatus && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-xs text-green-400">{processingStatus}</p>
        </div>
      )}
      
      {/* Practice recording Info */}
      <div className="mb-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs text-blue-400">
          🎤 Continuous recording for presentation practice. ⌘+Enter generates speaking prompts with audio context.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Recording Status - No controls since recording is continuous */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
              isRecording
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${
              isRecording ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}></div>
            {isRecording ? 'Recording Active' : 'Recording Inactive'}
          </div>
          
          {recordings.length > 0 && (
            <button
              onClick={clearAllRecordings}
              className="px-4 py-2 rounded-lg font-medium text-sm bg-white/[0.07] hover:bg-white/[0.1] text-white border border-white/[0.1] transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        {/* Keyboard Shortcuts Info */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-2">
          <div className="flex items-center justify-between text-white/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/40">Toggle Recording</span>
              <div className="flex gap-1">
                <kbd className="bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-1 text-[10px] leading-none text-white/50">
                  ⌘
                </kbd>
                <kbd className="bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-1 text-[10px] leading-none text-white/50">
                  A
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recordings List */}
      {recordings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white/70 text-xs font-medium">Recordings ({recordings.length})</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/[0.05] rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-medium truncate">
                    {recording.id}
                  </div>
                  <div className="text-white/50 text-xs">
                    {formatTimestamp(recording.timestamp)}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => transcribeRecording(recording.id)}
                    className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    title="Transcribe audio"
                  >
                    Transcribe
                  </button>
                  <button
                    onClick={() => processWithAudio(recording.id)}
                    className="px-2 py-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                    title="Process with audio"
                  >
                    Process
                  </button>
                  <button
                    onClick={() => deleteRecording(recording.id)}
                    className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}