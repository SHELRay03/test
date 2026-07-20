import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { CalendarEvent, TodoItem } from '../types'
import { expandEventsInRange, toDateKey } from './date'

export type SearchHit =
  | {
      kind: 'event'
      id: string
      title: string
      day: Date
      dayKey: string
      timeLabel: string
    }
  | {
      kind: 'todo'
      id: string
      title: string
      day: Date
      dayKey: string
      timeLabel: string
    }

export function searchItems(
  query: string,
  events: CalendarEvent[],
  todos: TodoItem[],
  now = new Date(),
): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const hits: SearchHit[] = []
  const rangeStart = addDays(startOfDay(now), -60)
  const rangeEnd = addDays(startOfDay(now), 120)
  const occurrences = expandEventsInRange(events, rangeStart, rangeEnd)

  for (const occ of occurrences) {
    if (!occ.event.title.toLowerCase().includes(q)) continue
    const day = startOfDay(occ.start)
    hits.push({
      kind: 'event',
      id: occ.event.id,
      title: occ.event.title,
      day,
      dayKey: toDateKey(day),
      timeLabel: format(occ.start, 'M月d日 HH:mm', { locale: zhCN }),
    })
  }

  for (const todo of todos) {
    if (!todo.title.toLowerCase().includes(q)) continue
    const day = todo.dueDate
      ? startOfDay(parseISO(`${todo.dueDate}T12:00:00`))
      : startOfDay(now)
    hits.push({
      kind: 'todo',
      id: todo.id,
      title: todo.title,
      day,
      dayKey: toDateKey(day),
      timeLabel: format(day, 'M月d日', { locale: zhCN }) + ' · 待办',
    })
  }

  hits.sort((a, b) => a.day.getTime() - b.day.getTime() || a.title.localeCompare(b.title, 'zh'))
  return hits
}

/** 是否只有唯一一天（可直接跳转） */
export function uniqueDayKey(hits: SearchHit[]): string | null {
  if (hits.length === 0) return null
  const keys = new Set(hits.map((h) => h.dayKey))
  return keys.size === 1 ? hits[0].dayKey : null
}
