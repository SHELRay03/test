import { parseISO } from 'date-fns'
import { useMemo } from 'react'
import { useAppStore } from '../store'
import {
  HOUR_END,
  HOUR_START,
  PX_PER_MINUTE,
  TIMELINE_HEIGHT,
  eventOverlapsDay,
  formatTime,
  minutesFromMidnight,
} from '../utils/date'
import { TodoSection } from './TodoSection'

export function DayView() {
  const anchorDate = useAppStore((s) => s.anchorDate)
  const events = useAppStore((s) => s.events)
  const showEvents = useAppStore((s) => s.filters.showEvents)
  const openEditor = useAppStore((s) => s.openEditor)

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    [],
  )

  const dayEvents = useMemo(() => {
    if (!showEvents) return []
    return events
      .filter((e) => eventOverlapsDay(e.start, e.end, anchorDate))
      .map((e) => {
        const start = parseISO(e.start)
        const end = parseISO(e.end)
        const startMin = Math.max(minutesFromMidnight(start), HOUR_START * 60)
        const endMin = Math.min(minutesFromMidnight(end), HOUR_END * 60)
        const top = (startMin - HOUR_START * 60) * PX_PER_MINUTE
        const height = Math.max((endMin - startMin) * PX_PER_MINUTE, 28)
        return { event: e, top, height, start, end }
      })
  }, [anchorDate, events, showEvents])

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
      </div>

      {!showEvents ? (
        <p className="empty-hint">已隐藏事件。勾选上方「事件」即可显示。</p>
      ) : (
        <div className="timeline">
          {hours.map((h) => (
            <div key={h} className="hour-row">
              <span className="hour-label">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
          <div className="timeline-canvas" style={{ height: TIMELINE_HEIGHT }}>
            {showNow && <div className="now-line" style={{ top: nowTop }} />}
            {dayEvents.map(({ event, top, height, start, end }) => (
              <button
                key={event.id}
                type="button"
                className={`event-block color-${event.color} ${event.completed ? 'done' : ''}`}
                style={{ top, height }}
                onClick={() => openEditor({ kind: 'event', id: event.id })}
              >
                <span className="t">{event.title}</span>
                <span className="m">
                  {formatTime(start)} – {formatTime(end)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
