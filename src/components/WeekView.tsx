import { isSameDay, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { useAppStore } from '../store'
import {
  HOUR_END,
  HOUR_START,
  eventOverlapsDay,
  formatMonthDay,
  formatShortDay,
  getWeekDays,
  minutesFromMidnight,
  todoOnDay,
} from '../utils/date'

const WEEK_PX = 0.9

export function WeekView() {
  const anchorDate = useAppStore((s) => s.anchorDate)
  const events = useAppStore((s) => s.events)
  const todos = useAppStore((s) => s.todos)
  const filters = useAppStore((s) => s.filters)
  const openEditor = useAppStore((s) => s.openEditor)
  const setAnchorDate = useAppStore((s) => s.setAnchorDate)
  const setViewMode = useAppStore((s) => s.setViewMode)

  const days = useMemo(() => getWeekDays(anchorDate), [anchorDate])
  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
    [],
  )
  const today = new Date()

  return (
    <div className="panel-inner">
      <div className="week-scroll">
        <div className="week-grid">
          <div className="week-head week-gutter" />
          {days.map((day) => (
            <button
              key={day.toISOString()}
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

          <div className="week-hours">
            {hours.map((h) => (
              <div key={h} className="week-hour-label">
                {String(h).padStart(2, '0')}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = filters.showEvents
              ? events.filter((e) => eventOverlapsDay(e.start, e.end, day))
              : []
            const dayTodos = filters.showTodos
              ? todos.filter((t) => todoOnDay(t.dueDate, day))
              : []

            return (
              <div key={`col-${day.toISOString()}`} className="week-day-col">
                {filters.showTodos && dayTodos.length > 0 && (
                  <div className="week-todos">
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
                )}
                {dayEvents.map((event) => {
                  const start = parseISO(event.start)
                  const end = parseISO(event.end)
                  const startMin = Math.max(minutesFromMidnight(start), HOUR_START * 60)
                  const endMin = Math.min(minutesFromMidnight(end), HOUR_END * 60)
                  const top = (startMin - HOUR_START * 60) * WEEK_PX
                  const height = Math.max((endMin - startMin) * WEEK_PX, 22)
                  return (
                    <button
                      key={event.id}
                      type="button"
                      className={`week-event color-${event.color}`}
                      style={{ top, height }}
                      onClick={() => openEditor({ kind: 'event', id: event.id })}
                    >
                      {event.title}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
