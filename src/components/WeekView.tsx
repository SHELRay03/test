import { isSameDay } from 'date-fns'
import { useCallback, useMemo, useRef } from 'react'
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
import { layoutOverlaps } from '../utils/layout'
import { DraggableEvent } from './DraggableEvent'
import { EmptyState } from './EmptyState'

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
  const requestMoveEvent = useAppStore((s) => s.requestMoveEvent)

  const days = useMemo(() => getWeekDays(anchorDate), [anchorDate])
  const hours = useMemo(
    () => Array.from({ length: WEEK_HOURS }, (_, i) => HOUR_START + i),
    [],
  )
  const today = new Date()
  const colRefs = useRef<(HTMLDivElement | null)[]>([])

  const weekOccurrences = useMemo(() => {
    if (!filters.showEvents) return []
    return eventsForWeek(events, days)
  }, [events, days, filters.showEvents])

  const resolveDayFromX = useCallback(
    (clientX: number) => {
      for (let i = 0; i < days.length; i++) {
        const el = colRefs.current[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (clientX >= rect.left && clientX <= rect.right) return days[i]
      }
      return null
    },
    [days],
  )

  const isEmpty = events.length === 0 && todos.length === 0
  if (isEmpty) {
    return (
      <div className="panel-inner">
        <EmptyState />
      </div>
    )
  }

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

          {/* 全天带 */}
          <div className="week-todo-gutter">
            <span>全天</span>
          </div>
          {days.map((day) => {
            const allDay = weekOccurrences.filter(
              (o) => o.event.allDay && occurrenceOverlapsDay(o.start, o.end, day),
            )
            return (
              <div key={`allday-${day.toISOString()}`} className="week-todo-cell">
                {allDay.map((occ) => (
                  <button
                    key={occ.occurrenceId}
                    type="button"
                    className={`week-todo-chip color-${occ.event.color} ${occ.event.completed ? 'done' : ''}`}
                    onClick={() => openEditor({ kind: 'event', id: occ.event.id })}
                  >
                    {occ.event.title}
                  </button>
                ))}
              </div>
            )
          })}

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

          <div className="week-hours" style={{ height: WEEK_BODY_HEIGHT }}>
            {hours.map((h) => (
              <div key={h} className="week-hour-label">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => {
            const dayEvents = layoutOverlaps(
              weekOccurrences.filter(
                (o) => !o.event.allDay && occurrenceOverlapsDay(o.start, o.end, day),
              ),
            )
            return (
              <div
                key={`col-${day.toISOString()}`}
                className="week-day-col"
                style={{ height: WEEK_BODY_HEIGHT }}
                ref={(el) => {
                  colRefs.current[dayIndex] = el
                }}
              >
                {dayEvents.map((occ) => {
                  const width = `calc((100% - 0.3rem) / ${occ.colCount})`
                  const left = `calc(0.15rem + ((100% - 0.3rem) / ${occ.colCount}) * ${occ.col})`
                  return (
                    <DraggableEvent
                      key={occ.occurrenceId}
                      occurrence={occ}
                      day={day}
                      pxPerMinute={WEEK_PX}
                      className="week-event-drag"
                      styleExtra={{ left, width, right: 'auto' }}
                      resolveDayFromX={resolveDayFromX}
                      onOpen={() => openEditor({ kind: 'event', id: occ.event.id })}
                      onCommit={({ start, end }) => {
                        void requestMoveEvent(occ.event.id, day, start, end)
                      }}
                    />
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
