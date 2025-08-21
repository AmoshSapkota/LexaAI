import React, { useState, useEffect, useRef } from "react"
import { useToast } from "../contexts/toast"
import { COMMAND_KEY } from "../utils/platform"
import ScreenshotQueue from "../components/ScreenshotQueue"

export interface NotesProps {
  setView: (view: "notes" | "teleprompter" | "practice") => void
  currentLanguage: string
  setLanguage: (language: string) => void
}

interface Note {
  id: string
  title: string
  content: string
  timestamp: number
  screenshots: string[]
}

const Notes: React.FC<NotesProps> = ({
  setView,
  currentLanguage,
  setLanguage
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [screenshots, setScreenshots] = useState<any[]>([])

  const { showToast } = useToast()

  useEffect(() => {
    const fetchScreenshots = async () => {
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
        setScreenshots([])
      }
    }

    fetchScreenshots()
    loadNotes()
  }, [])

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
        setScreenshots([])
        setSelectedNote(null)
        setNoteTitle("")
        setNoteContent("")
        setIsEditing(false)
      })
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [])

  const loadNotes = () => {
    // Load notes from localStorage for now
    const savedNotes = localStorage.getItem("speakassist-notes")
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
  }

  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem("speakassist-notes", JSON.stringify(updatedNotes))
    setNotes(updatedNotes)
  }

  const createNewNote = () => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: "New Note",
      content: "",
      timestamp: Date.now(),
      screenshots: screenshots.map(s => s.path)
    }
    
    const updatedNotes = [newNote, ...notes]
    saveNotes(updatedNotes)
    setSelectedNote(newNote)
    setNoteTitle(newNote.title)
    setNoteContent(newNote.content)
    setIsEditing(true)
    showToast("Success", "New note created", "success")
  }

  const saveCurrentNote = () => {
    if (!selectedNote) return

    const updatedNotes = notes.map(note => 
      note.id === selectedNote.id 
        ? { ...note, title: noteTitle, content: noteContent, timestamp: Date.now() }
        : note
    )
    
    saveNotes(updatedNotes)
    setSelectedNote({ ...selectedNote, title: noteTitle, content: noteContent })
    setIsEditing(false)
    showToast("Success", "Note saved", "success")
  }

  const deleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId)
    saveNotes(updatedNotes)
    
    if (selectedNote?.id === noteId) {
      setSelectedNote(null)
      setNoteTitle("")
      setNoteContent("")
      setIsEditing(false)
    }
    
    showToast("Success", "Note deleted", "success")
  }

  const selectNote = (note: Note) => {
    if (isEditing) {
      saveCurrentNote()
    }
    
    setSelectedNote(note)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setIsEditing(false)
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div ref={contentRef} className="p-6 space-y-6">
      {/* Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("notes")}
          className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white transition-colors"
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
          className="px-3 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          Practice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes List */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">My Notes</h2>
            <button
              onClick={createNewNote}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition-colors"
            >
              + New Note
            </button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedNote?.id === note.id 
                    ? 'bg-blue-500/20 border border-blue-500/30' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium text-white truncate">{note.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNote(note.id)
                    }}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatTimestamp(note.timestamp)}</p>
                <p className="text-xs text-gray-300 mt-1 truncate">{note.content}</p>
              </div>
            ))}
            
            {notes.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No notes yet</p>
                <p className="text-xs mt-1">Create your first note to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Note Editor */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">
                  {isEditing ? "Editing Note" : "Viewing Note"}
                </h2>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveCurrentNote}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setNoteTitle(selectedNote.title)
                          setNoteContent(selectedNote.content)
                          setIsEditing(false)
                        }}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Note title..."
                  />
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Write your notes here..."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">{selectedNote.title}</h3>
                  <div className="text-sm text-gray-300 whitespace-pre-wrap bg-white/5 rounded-md p-4 min-h-64">
                    {selectedNote.content || "No content yet. Click Edit to add content."}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Select a note to view or edit</p>
              <p className="text-sm mt-2">Or create a new note to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Screenshots Section */}
      {screenshots.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-white mb-3">Available Content</h3>
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
      <div className="flex gap-2">
        <button
          onClick={() => window.electronAPI.triggerScreenshot()}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          📸 Capture Content ({COMMAND_KEY}+H)
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <h3 className="text-sm font-medium text-green-300 mb-2">Note-Taking Tips</h3>
        <div className="text-xs text-green-200 space-y-1">
          <p>• Capture screenshots of important content to reference while taking notes</p>
          <p>• Use the teleprompter view to convert your notes into speaking prompts</p>
          <p>• Practice mode will help you rehearse your presentations</p>
          <p>• All notes are saved locally on your device</p>
        </div>
      </div>
    </div>
  )
}

export default Notes