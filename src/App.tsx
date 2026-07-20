import { useEffect } from 'react'
import { DayView } from './components/DayView'
import { EditorPanel } from './components/EditorPanel'
import { Header } from './components/Header'
import { WeekView } from './components/WeekView'
import { useAppStore } from './store'
import { startReminderLoop } from './utils/reminders'

export default function App() {
  const ready = useAppStore((s) => s.ready)
  const hydrate = useAppStore((s) => s.hydrate)
  const viewMode = useAppStore((s) => s.viewMode)
  const editor = useAppStore((s) => s.editor)
  const closeEditor = useAppStore((s) => s.closeEditor)
  const openEditor = useAppStore((s) => s.openEditor)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const setAnchorDate = useAppStore((s) => s.setAnchorDate)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!ready) return
    return startReminderLoop(() => useAppStore.getState().events)
  }, [ready])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      if (e.key === 'Escape') {
        if (editor) {
          e.preventDefault()
          closeEditor()
        } else if (useAppStore.getState().searchQuery) {
          setSearchQuery('')
        }
        return
      }

      if (typing) return

      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        document.getElementById('lumina-search')?.focus()
        return
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        if (e.shiftKey) openEditor({ kind: 'todo', id: null })
        else openEditor({ kind: 'event', id: null })
        return
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        setAnchorDate(new Date())
        return
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        setViewMode('day')
        return
      }

      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        setViewMode('week')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    editor,
    closeEditor,
    openEditor,
    setViewMode,
    setAnchorDate,
    setSearchQuery,
  ])

  if (!ready) {
    return <div className="loading">Lumina Memo</div>
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="main-panel">
        {viewMode === 'day' ? <DayView /> : <WeekView />}
      </main>
      <EditorPanel />
    </div>
  )
}
