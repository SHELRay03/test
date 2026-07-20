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

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!ready) return
    return startReminderLoop(() => useAppStore.getState().events)
  }, [ready])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && editor) {
        e.preventDefault()
        closeEditor()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor, closeEditor])

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
