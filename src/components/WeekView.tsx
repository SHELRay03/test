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
const WEEK_HOURS = HOUR_END - HOUR_START
const WEEK_BODY_HEIGHT = WEEK_HOURS * 60 * WEEK_PX

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
    () => Array.from({ length: WEEK_HOURS }, (_, i) => HOUR_START + i),
    [],
  )
  const today = new Date()

  return (
    <div className="panel-inner">
      <div className="week-scroll">
        <div className="week-grid">
          {/* 表头：日期 */}
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

          {/* 待办带：与时间轴分离，避免和小时轴重叠 */}
          <div className="week-todo-gutter">
            {filters.showTodos ? <span>待办</span> : null}
          </div>
          {days.map((day) => {
            const dayTodos = filters.showTodos
              ? todos.filter((t) => todoOnDay(t.dueDate, day))
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

          {/* 时间主体 */}
          <div className="week-hours" style={{ height: WEEK_BODY_HEIGHT }}>
            {hours.map((h) => (
              <div key={h} className="week-hour-label">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = filters.showEvents
              ? events.filter((e) => eventOverlapsDay(e.start, e.end, day))
              : []

            return (
              <div
                key={`col-${day.toISOString()}`}
                className="week-day-col"
                style={{ height: WEEK_BODY_HEIGHT }}
              >
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
