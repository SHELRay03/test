import { isSameDay } from 'date-fns'
import { useMemo } from 'react'
import { useAppStore } from '../store'
import {
  HOUR_END,
  HOUR_START,
  WEEK_PX,
  eventsForWeek,
  formatMonthDay,
  formatShortDay,
  getWeekDays,
  occurrenceOverlapsDay,
  todoOnDay,
} from '../utils/date'
import { DraggableEvent } from './DraggableEvent'

const WEEK_HOURS = HOUR_END - HOUR_START
const WEEK_BODY_HEIGHT = WEEK_HOURS * 60 * WEEK_PX

export function WeekView() {
  const anchorDate = useAppStore((s) => s.anchorDate)
  const events = useAppStore((s) => s.events)
  const todos = useAppStore((s) => s.todos)
  const filters = useAppStore((s) => s.filters)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const openEditor = useAppStore((s) => s.openEditor)
  const setAnchorDate = useAppStore((s) => s.setAnchorDate)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const moveEventTimes = useAppStore((s) => s.moveEventTimes)

  const days = useMemo(() => getWeekDays(anchorDate), [anchorDate])
  const hours = useMemo(
    () => Array.from({ length: WEEK_HOURS }, (_, i) => HOUR_START + i),
    [],
  )
  const today = new Date()
  const q = searchQuery.trim().toLowerCase()

  const weekOccurrences = useMemo(() => {
    if (!filters.showEvents) return []
    return eventsForWeek(events, days).filter(
      (o) => !q || o.event.title.toLowerCase().includes(q),
    )
  }, [events, days, filters.showEvents, q])

  return (
    <div className="panel-inner">
      <div className="week-scroll">
        <div className="week-grid">
          <div className="week-corner" aria-hidden="true" />
          {days.map((day) => (
            <button
              key={`head-${day.toISOString()}`}
              type="button"
              className={`week-head ${isSameDay(day, today) ? 'today' : ''}`}
              onClick={() => {
                setAnchorDate(day)
                setViewMode('day')
              }}
            >
              <span className="d">{formatShortDay(day)}</span>
              <span className="n">{formatMonthDay(day)}</span>
            </button>
          ))}

          <div className="week-todo-gutter">
            {filters.showTodos ? <span>待办</span> : null}
          </div>
          {days.map((day) => {
            const dayTodos = filters.showTodos
              ? todos.filter(
                  (t) =>
                    todoOnDay(t.dueDate, day) &&
                    (!q || t.title.toLowerCase().includes(q)),
                )
              : []
            return (
              <div key={`todos-${day.toISOString()}`} className="week-todo-cell">
                {dayTodos.map((todo) => (
                  <button
                    key={todo.id}
                    type="button"
                    className={`week-todo-chip color-${todo.color} ${todo.completed ? 'done' : ''}`}
                    onClick={() => openEditor({ kind: 'todo', id: todo.id })}
                  >
                    {todo.title}
                  </button>
                ))}
              </div>
            )
          })}

          <div className="week-hours" style={{ height: WEEK_BODY_HEIGHT }}>
            {hours.map((h) => (
              <div key={h} className="week-hour-label">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = weekOccurrences.filter((o) =>
              occurrenceOverlapsDay(o.start, o.end, day),
            )
            return (
              <div
                key={`col-${day.toISOString()}`}
                className="week-day-col"
                style={{ height: WEEK_BODY_HEIGHT }}
              >
                {dayEvents.map((occ) => (
                  <DraggableEvent
                    key={occ.occurrenceId}
                    occurrence={occ}
                    day={day}
                    pxPerMinute={WEEK_PX}
                    className="week-event-drag"
                    onOpen={() => openEditor({ kind: 'event', id: occ.event.id })}
                    onCommit={({ start, end }) => {
                      void moveEventTimes(occ.event.id, start, end)
                    }}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
