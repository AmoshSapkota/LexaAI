import React, { useState, useEffect, useRef } from "react"
import { useToast } from "../contexts/toast"
import { COMMAND_KEY } from "../utils/platform"

export interface PracticeProps {
  setView: (view: "notes" | "teleprompter" | "practice") => void
  currentLanguage: string
  setLanguage: (language: string) => void
}

const Practice: React.FC<PracticeProps> = ({
  setView,
  currentLanguage,
  setLanguage
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [practiceMode, setPracticeMode] = useState<"presentation" | "interview" | "speech">("presentation")
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [practiceHistory, setPracticeHistory] = useState<any[]>([])
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const { showToast } = useToast()

  const practicePrompts = {
    presentation: [
      "Explain the main objective of your project",
      "Walk through your methodology step by step",
      "Discuss the challenges you encountered",
      "Present your key findings and results",
      "Explain the impact and significance of your work"
    ],
    interview: [
      "Tell me about yourself and your background",
      "Describe a challenging project you worked on",
      "How do you handle working under pressure?",
      "What are your greatest strengths?",
      "Where do you see yourself in 5 years?"
    ],
    speech: [
      "Start with a compelling opening statement",
      "Share a personal story or experience",
      "Present your main argument or thesis",
      "Provide supporting evidence and examples",
      "Conclude with a call to action"
    ]
  }

  useEffect(() => {
    // Timer effect
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  useEffect(() => {
    // Audio recording status monitoring
    const checkRecordingStatus = async () => {
      try {
        const result = await window.electronAPI.isRecordingAudio()
        if (result.success) {
          setIsRecording(result.isRecording || false)
        }
      } catch (err) {
        console.error('Error checking recording status:', err)
      }
    }

    checkRecordingStatus()
    const interval = setInterval(checkRecordingStatus, 1000)

    // Height update logic
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    return () => {
      clearInterval(interval)
      resizeObserver.disconnect()
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getRandomPrompt = (mode: string) => {
    const prompts = practicePrompts[mode as keyof typeof practicePrompts]
    return prompts[Math.floor(Math.random() * prompts.length)]
  }

  const startPracticeSession = () => {
    const prompt = getRandomPrompt(practiceMode)
    setCurrentPrompt(prompt)
    setTimer(0)
    setIsTimerRunning(true)
    showToast("Practice Started", "Good luck with your practice session!", "success")
  }

  const endPracticeSession = () => {
    setIsTimerRunning(false)
    const session = {
      id: Date.now(),
      mode: practiceMode,
      prompt: currentPrompt,
      duration: timer,
      timestamp: Date.now()
    }
    setPracticeHistory(prev => [session, ...prev.slice(0, 9)]) // Keep last 10 sessions
    setCurrentPrompt("")
    showToast("Practice Complete", `Session lasted ${formatTime(timer)}`, "success")
  }

  const resetTimer = () => {
    setTimer(0)
    setIsTimerRunning(false)
    setCurrentPrompt("")
  }

  return (
    <div ref={contentRef} className="p-6 space-y-6">
      {/* Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("notes")}
          className="px-3 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          Notes
        </button>
        <button
          onClick={() => setView("teleprompter")}
          className="px-3 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          Teleprompter
        </button>
        <button
          onClick={() => setView("practice")}
          className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white transition-colors"
        >
          Practice
        </button>
      </div>

      {/* Practice Mode Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Practice Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(practicePrompts).map(([mode, prompts]) => (
            <button
              key={mode}
              onClick={() => setPracticeMode(mode as any)}
              className={`p-4 rounded-lg text-left transition-colors ${
                practiceMode === mode 
                  ? 'bg-blue-500/20 border border-blue-500/30' 
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <h3 className="text-sm font-medium text-white capitalize mb-2">{mode}</h3>
              <p className="text-xs text-gray-300">{prompts.length} practice prompts</p>
            </button>
          ))}
        </div>
      </div>

      {/* Timer and Controls */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl font-mono text-white">{formatTime(timer)}</div>
          
          {currentPrompt ? (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-300 mb-2">Current Prompt:</h3>
                <p className="text-white">{currentPrompt}</p>
              </div>
              
              <div className="flex gap-2 justify-center">
                <button
                  onClick={endPracticeSession}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Complete Session
                </button>
                <button
                  onClick={resetTimer}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startPracticeSession}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Start Practice Session
            </button>
          )}
        </div>
      </div>

      {/* Recording Status */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-white">
              Audio Recording: {isRecording ? 'Active' : 'Inactive'}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            Continuous recording helps with feedback analysis
          </span>
        </div>
      </div>

      {/* Practice History */}
      {practiceHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Recent Practice Sessions</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {practiceHistory.map(session => (
              <div key={session.id} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-white capitalize">{session.mode}</h4>
                    <p className="text-xs text-gray-300 mt-1">{session.prompt}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white">{formatTime(session.duration)}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <h3 className="text-sm font-medium text-purple-300 mb-2">Practice Tips</h3>
        <div className="text-xs text-purple-200 space-y-1">
          <p>• Speak clearly and at a steady pace</p>
          <p>• Make eye contact with an imaginary audience</p>
          <p>• Use gestures and body language to emphasize points</p>
          <p>• Practice breathing techniques to stay calm</p>
          <p>• Record yourself to review your performance later</p>
        </div>
      </div>
    </div>
  )
}

export default Practice