// file: src/components/SubscribedApp.tsx
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import Queue from "../_pages/Queue"
import Solutions from "../_pages/Solutions"
import { useToast } from "../contexts/toast"

interface SubscribedAppProps {
  credits: number
  currentLanguage: string
  setLanguage: (language: string) => void
}

const SubscribedApp: React.FC<SubscribedAppProps> = ({
  credits,
  currentLanguage,
  setLanguage
}) => {
  const queryClient = useQueryClient()
  const [view, setView] = useState<"queue" | "solutions" | "debug">("queue")
  const containerRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  // Add console.log to track view changes
  useEffect(() => {
    console.log("LexaAI: View changed to", view);
  }, [view]);

  // Let's ensure we reset queries etc. if some electron signals happen
  useEffect(() => {
    const cleanup = window.electronAPI.onResetView(() => {
      queryClient.invalidateQueries({
        queryKey: ["screenshots"]
      })
      queryClient.invalidateQueries({
        queryKey: ["solutions"]
      })
      setView("queue")
    })

    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    const cleanupFunctions = [
      window.electronAPI.onSolutionStart(() => {
        console.log("LexaAI: Received solution start event. Setting view to solutions.");
        setView("solutions")
      }),
      window.electronAPI.onSolutionSuccess((data) => {
        console.log("SpeakAssist: Received analysis success event. Data:", data);
        // Make sure we're in teleprompter view to display the results
        setView("solutions")
      }),
      window.electronAPI.onUnauthorized(() => {
        queryClient.removeQueries({
          queryKey: ["screenshots"]
        })
        queryClient.removeQueries({
          queryKey: ["solutions"]
        })
        setView("queue")
      }),
      window.electronAPI.onResetView(() => {
        queryClient.removeQueries({
          queryKey: ["screenshots"]
        })
        queryClient.removeQueries({
          queryKey: ["solutions"]
        })
        setView("queue")
      }),
      window.electronAPI.onProblemExtracted((data: any) => {
        if (view === "queue") {
          queryClient.invalidateQueries({
            queryKey: ["extracted_content"]
          })
          queryClient.setQueryData(["extracted_content"], data)
        }
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast("Analysis Failed", error, "error")
      })
    ]
    return () => cleanupFunctions.forEach((fn) => fn())
  }, [view])

  return (
    <div ref={containerRef} className="min-h-0">
      {view === "queue" ? (
        <Queue />
      ) : view === "solutions" ? (
        <Solutions />
      ) : null}
    </div>
  )
}

export default SubscribedApp