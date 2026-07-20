import { useEffect } from 'react'
import { DayView } from './components/DayView'
import { EditorPanel } from './components/EditorPanel'
import { Header } from './components/Header'
import { WeekView } from './components/WeekView'
import { useAppStore } from './store'

export default function App() {
  const ready = useAppStore((s) => s.ready)
  const hydrate = useAppStore((s) => s.hydrate)
  const viewMode = useAppStore((s) => s.viewMode)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

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
