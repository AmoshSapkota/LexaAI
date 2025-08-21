import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"

import ScreenshotQueue from "../components/ScreenshotQueue"
import { useToast } from "../contexts/toast"
import { COMMAND_KEY } from "../utils/platform"

export interface TeleprompterProps {
  setView: (view: "notes" | "teleprompter" | "practice") => void
  currentLanguage: string
  setLanguage: (language: string) => void
}

const TeleprompterSection = ({
  title,
  content,
  isLoading
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-[13px] font-medium text-white tracking-wide">
      {title}
    </h2>
    {isLoading ? (
      <div className="mt-4 flex">
        <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
          Generating speaking prompts...
        </p>
      </div>
    ) : (
      <div className="text-[13px] leading-[1.4] text-gray-100 max-w-[600px] bg-white/5 rounded-md p-3">
        {content}
      </div>
    )}
  </div>
)

const Teleprompter: React.FC<TeleprompterProps> = ({
  setView,
  currentLanguage,
  setLanguage
}) => {
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  const [keywords, setKeywords] = useState<string[]>([])
  const [bulletPoints, setBulletPoints] = useState<string[]>([])
  const [speakingTips, setSpeakingTips] = useState<string[]>([])
  const [isResetting, setIsResetting] = useState(false)

  interface Screenshot {
    id: string
    path: string
    preview: string
    timestamp: number
  }

  const [screenshots, setScreenshots] = useState<Screenshot[]>([])

  useEffect(() => {
    const fetchScreenshots = async () => {
      try {
        const existing = await window.electronAPI.getScreenshots()
        console.log("Raw screenshot data:", existing)
        const screenshots = (Array.isArray(existing) ? existing : []).map(
          (p) => ({
            id: p.path,
            path: p.path,
            preview: p.preview,
            timestamp: Date.now()
          })
        )
        console.log("Processed screenshots:", screenshots)
        setScreenshots(screenshots)
      } catch (error) {
        console.error("Error loading screenshots:", error)
        setScreenshots([])
      }
    }

    fetchScreenshots()
  }, [])

  const { showToast } = useToast()

  useEffect(() => {
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

    // Initialize resize observer
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    // Set up event listeners
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(async () => {
        try {
          const existing = await window.electronAPI.getScreenshots()
          const screenshots = (Array.isArray(existing) ? existing : []).map(
            (p) => ({
              id: p.path,
              path: p.path,
              preview: p.preview,
              timestamp: Date.now()
            })
          )
          setScreenshots(screenshots)
        } catch (error) {
          console.error("Error loading screenshots:", error)
        }
      }),
      window.electronAPI.onResetView(() => {
        setIsResetting(true)
        setKeywords([])
        setBulletPoints([])
        setSpeakingTips([])
        setScreenshots([])
        setTimeout(() => {
          setIsResetting(false)
        }, 0)
      }),
      window.electronAPI.onSolutionStart(() => {
        // Reset when processing starts
        setKeywords([])
        setBulletPoints([])
        setSpeakingTips([])
      }),
      window.electronAPI.onSolutionSuccess((data) => {
        console.log("Teleprompter: Received analysis data:", data)
        if (data) {
          // Extract teleprompter-relevant information
          setKeywords(data.keywords || [])
          setBulletPoints(data.bullet_points || [])
          setSpeakingTips(data.speaking_tips || [])
        }
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast("Analysis Failed", error, "error")
        console.error("Analysis error:", error)
      })
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [])

  const formatBulletPoints = (points: string[]) => {
    return points.map((point, index) => (
      <div key={index} className="flex items-start gap-2 mb-2">
        <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
        <span>{point}</span>
      </div>
    ))
  }

  const formatKeywords = (words: string[]) => {
    return words.map((word, index) => (
      <span
        key={index}
        className="inline-block bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md text-xs mr-2 mb-2"
      >
        {word}
      </span>
    ))
  }

  return (
    <div ref={contentRef} className="p-6 space-y-6">
      {!isResetting && (
        <>
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
              className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white transition-colors"
            >
              Teleprompter
            </button>
            <button
              onClick={() => setView("practice")}
              className="px-3 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Practice
            </button>
          </div>

          {/* Screenshots */}
          {screenshots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white mb-3">Content References</h3>
              <ScreenshotQueue
                screenshots={screenshots}
                onDeleteScreenshot={async (path) => {
                  await window.electronAPI.deleteScreenshot(path)
                  setScreenshots(prev => prev.filter(s => s.path !== path))
                }}
                currentLanguage={currentLanguage}
                setLanguage={setLanguage}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => window.electronAPI.triggerScreenshot()}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              📸 Capture Content ({COMMAND_KEY}+H)
            </button>
            <button
              onClick={() => window.electronAPI.triggerProcessScreenshots()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              🎤 Generate Speaking Prompts ({COMMAND_KEY}+Enter)
            </button>
          </div>

          {/* Teleprompter Content */}
          <div className="space-y-6">
            {/* Keywords */}
            <TeleprompterSection
              title="🔑 Key Terms & Keywords"
              content={
                keywords.length > 0 ? (
                  <div className="flex flex-wrap">{formatKeywords(keywords)}</div>
                ) : (
                  <span className="text-gray-400">Capture content and generate prompts to see key terms</span>
                )
              }
              isLoading={false}
            />

            {/* Bullet Points */}
            <TeleprompterSection
              title="📝 Speaking Points"
              content={
                bulletPoints.length > 0 ? (
                  <div>{formatBulletPoints(bulletPoints)}</div>
                ) : (
                  <span className="text-gray-400">Capture content and generate prompts to see talking points</span>
                )
              }
              isLoading={false}
            />

            {/* Speaking Tips */}
            <TeleprompterSection
              title="💡 Speaking Tips"
              content={
                speakingTips.length > 0 ? (
                  <div>{formatBulletPoints(speakingTips)}</div>
                ) : (
                  <span className="text-gray-400">Capture content and generate prompts to see speaking tips</span>
                )
              }
              isLoading={false}
            />
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-300 mb-2">How to Use SpeakAssist</h3>
            <div className="text-xs text-blue-200 space-y-1">
              <p>1. 📸 Capture screenshots of your presentation materials, documents, or whiteboards</p>
              <p>2. 🎤 Generate speaking prompts to get AI-powered keywords and talking points</p>
              <p>3. 🗣️ Use the keywords and bullet points as a teleprompter while speaking</p>
              <p>4. 🎯 Build confidence with structured guidance for presentations and interviews</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Teleprompter