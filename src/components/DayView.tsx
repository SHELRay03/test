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
import { layoutOverlaps } from '../utils/layout'
import { DraggableEvent } from './DraggableEvent'
import { EmptyState } from './EmptyState'
import { TodayFocus } from './TodayFocus'
import { TodoSection } from './TodoSection'

export function DayView() {
  const anchorDate = useAppStore((s) => s.anchorDate)
  const events = useAppStore((s) => s.events)
  const todos = useAppStore((s) => s.todos)
  const showEvents = useAppStore((s) => s.filters.showEvents)
  const openEditor = useAppStore((s) => s.openEditor)
  const requestMoveEvent = useAppStore((s) => s.requestMoveEvent)

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    [],
  )

  const dayOccurrences = useMemo(() => {
    if (!showEvents) return []
    return eventsForDay(events, anchorDate)
  }, [anchorDate, events, showEvents])

  const allDayEvents = useMemo(
    () => dayOccurrences.filter((o) => o.event.allDay),
    [dayOccurrences],
  )

  const timedLaidOut = useMemo(
    () => layoutOverlaps(dayOccurrences.filter((o) => !o.event.allDay)),
    [dayOccurrences],
  )

  const isEmpty = events.length === 0 && todos.length === 0

  const now = new Date()
  const showNow =
    now.toDateString() === anchorDate.toDateString() &&
    minutesFromMidnight(now) >= HOUR_START * 60 &&
    minutesFromMidnight(now) <= HOUR_END * 60
  const nowTop = (minutesFromMidnight(now) - HOUR_START * 60) * PX_PER_MINUTE

  if (isEmpty) {
    return (
      <div className="panel-inner">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="panel-inner">
      <TodayFocus day={anchorDate} />
      <TodoSection day={anchorDate} />

      {showEvents && allDayEvents.length > 0 && (
        <section className="allday-row" aria-label="全天事件">
          <div className="section-head">
            <h2>全天</h2>
          </div>
          <div className="allday-list">
            {allDayEvents.map((occ) => (
              <button
                key={occ.occurrenceId}
                type="button"
                className={`allday-chip color-${occ.event.color} ${occ.event.completed ? 'done' : ''}`}
                onClick={() => openEditor({ kind: 'event', id: occ.event.id })}
              >
                {occ.event.title}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="section-head">
        <h2>时间轴</h2>
        <span className="hint-inline">拖动改时间，底边拉时长</span>
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
            {timedLaidOut.map((occ) => {
              const width = `calc((100% - 0.5rem) / ${occ.colCount})`
              const left = `calc(0.25rem + ((100% - 0.5rem) / ${occ.colCount}) * ${occ.col})`
              return (
                <DraggableEvent
                  key={occ.occurrenceId}
                  occurrence={occ}
                  day={anchorDate}
                  pxPerMinute={PX_PER_MINUTE}
                  styleExtra={{ left, width, right: 'auto' }}
                  onOpen={() => openEditor({ kind: 'event', id: occ.event.id })}
                  onCommit={({ start, end, day }) => {
                    void requestMoveEvent(occ.event.id, day, start, end)
                  }}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
