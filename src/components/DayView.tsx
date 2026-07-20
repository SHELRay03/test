import { useMemo } from 'react'
import { useAppStore } from '../store'
import {
  HOUR_END,
  HOUR_START,
  PX_PER_MINUTE,
  TIMELINE_HEIGHT,
  eventsForDay,
  minutesFromMidnight,
} from '../utils/date'
import { DraggableEvent } from './DraggableEvent'
import { TodoSection } from './TodoSection'

export function DayView() {
  const anchorDate = useAppStore((s) => s.anchorDate)
  const events = useAppStore((s) => s.events)
  const showEvents = useAppStore((s) => s.filters.showEvents)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const openEditor = useAppStore((s) => s.openEditor)
  const moveEventTimes = useAppStore((s) => s.moveEventTimes)

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    [],
  )

  const dayEvents = useMemo(() => {
    if (!showEvents) return []
    const q = searchQuery.trim().toLowerCase()
    return eventsForDay(events, anchorDate).filter(
      (o) => !q || o.event.title.toLowerCase().includes(q),
    )
  }, [anchorDate, events, showEvents, searchQuery])

  const now = new Date()
  const showNow =
    now.toDateString() === anchorDate.toDateString() &&
    minutesFromMidnight(now) >= HOUR_START * 60 &&
    minutesFromMidnight(now) <= HOUR_END * 60
  const nowTop = (minutesFromMidnight(now) - HOUR_START * 60) * PX_PER_MINUTE

  return (
    <div className="panel-inner">
      <TodoSection day={anchorDate} />

      <div className="section-head">
        <h2>时间轴</h2>
        <span className="hint-inline">拖动事件改时间，底边拉时长</span>
      </div>

      {!showEvents ? (
        <p className="empty-hint">已隐藏事件。勾选上方「事件」即可显示。</p>
      ) : (
        <div className="timeline" style={{ height: TIMELINE_HEIGHT }}>
          <div className="timeline-hours" aria-hidden="true">
            {hours.map((h) => (
              <div key={h} className="hour-row">
                <span className="hour-label">{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          <div className="timeline-canvas">
            {showNow && <div className="now-line" style={{ top: nowTop }} />}
            {dayEvents.map((occ) => (
              <DraggableEvent
                key={occ.occurrenceId}
                occurrence={occ}
                day={anchorDate}
                pxPerMinute={PX_PER_MINUTE}
                onOpen={() => openEditor({ kind: 'event', id: occ.event.id })}
                onCommit={({ start, end }) => {
                  void moveEventTimes(occ.event.id, start, end)
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
