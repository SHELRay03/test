import { useMemo } from 'react'
import { useAppStore } from '../store'
import {
  eventsForDay,
  formatTime,
  minutesFromMidnight,
  todoOnDay,
} from '../utils/date'

export function TodayFocus({ day }: { day: Date }) {
  const events = useAppStore((s) => s.events)
  const todos = useAppStore((s) => s.todos)
  const openEditor = useAppStore((s) => s.openEditor)

  const focus = useMemo(() => {
    const now = new Date()
    const isToday = now.toDateString() === day.toDateString()
    const nowMin = minutesFromMidnight(now)

    const timed = eventsForDay(events, day)
      .filter((o) => !o.event.allDay && !o.event.completed)
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    const nextEvent = isToday
      ? timed.find((o) => minutesFromMidnight(o.end) > nowMin) ?? null
      : timed[0] ?? null

    const openTodos = todos
      .filter((t) => todoOnDay(t.dueDate, day) && !t.completed)
      .sort((a, b) => a.title.localeCompare(b.title, 'zh'))

    if (nextEvent) {
      return {
        kind: 'event' as const,
        id: nextEvent.event.id,
        title: nextEvent.event.title,
        meta: `${formatTime(nextEvent.start)} – ${formatTime(nextEvent.end)}`,
        label: isToday && minutesFromMidnight(nextEvent.start) <= nowMin ? '进行中' : '下一件',
      }
    }
    if (openTodos[0]) {
      return {
        kind: 'todo' as const,
        id: openTodos[0].id,
        title: openTodos[0].title,
        meta: '待办',
        label: '待完成',
      }
    }
    return null
  }, [events, todos, day])

  if (!focus) {
    return (
      <div className="today-focus is-clear">
        <span className="today-focus-label">今日焦点</span>
        <span className="today-focus-title">这一天暂时空着，很好。</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="today-focus"
      onClick={() => openEditor({ kind: focus.kind, id: focus.id })}
    >
      <span className="today-focus-label">{focus.label}</span>
      <span className="today-focus-title">{focus.title}</span>
      <span className="today-focus-meta">{focus.meta}</span>
    </button>
  )
}
