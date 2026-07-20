import type { CalendarEvent, RecurrenceRule, TodoItem } from '../types'
import { normalizeRecurrence, parseISO, toDateKey } from './date'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** UTC ICS timestamp */
function toIcsUtc(date: Date): string {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function rruleOf(rule: RecurrenceRule, eventStart: Date): string | null {
  const r = normalizeRecurrence(rule)
  if (r.freq === 'none') return null
  const parts: string[] = []
  if (r.freq === 'daily') {
    parts.push('FREQ=DAILY', `INTERVAL=${r.interval}`)
  } else if (r.freq === 'weekly') {
    const map = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    parts.push('FREQ=WEEKLY', `INTERVAL=${r.interval}`, `BYDAY=${map[eventStart.getDay()]}`)
  } else {
    // custom → 每 N 天
    parts.push('FREQ=DAILY', `INTERVAL=${r.interval}`)
  }
  if (r.until) {
    const until = parseISO(r.until + 'T23:59:59')
    parts.push(`UNTIL=${toIcsUtc(until)}`)
  }
  return parts.join(';')
}

export function buildIcsCalendar(
  events: CalendarEvent[],
  todos: TodoItem[],
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lumina Memo//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Lumina Memo',
  ]

  const stamp = toIcsUtc(new Date())

  for (const event of events) {
    const start = parseISO(event.start)
    const end = parseISO(event.end)
    const rrule = rruleOf(event.recurrence, start)
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${event.id}@lumina-memo`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`DTSTART:${toIcsUtc(start)}`)
    lines.push(`DTEND:${toIcsUtc(end)}`)
    lines.push(`SUMMARY:${escapeText(event.title)}`)
    if (event.note) lines.push(`DESCRIPTION:${escapeText(event.note)}`)
    if (rrule) lines.push(`RRULE:${rrule}`)
    if (event.remindMinutes != null) {
      lines.push('BEGIN:VALARM')
      lines.push('ACTION:DISPLAY')
      lines.push(`TRIGGER:-PT${event.remindMinutes}M`)
      lines.push(`DESCRIPTION:${escapeText(event.title)}`)
      lines.push('END:VALARM')
    }
    lines.push('END:VEVENT')
  }

  for (const todo of todos) {
    lines.push('BEGIN:VTODO')
    lines.push(`UID:todo-${todo.id}@lumina-memo`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`SUMMARY:${escapeText(todo.title)}`)
    if (todo.note) lines.push(`DESCRIPTION:${escapeText(todo.note)}`)
    if (todo.dueDate) {
      lines.push(`DUE;VALUE=DATE:${todo.dueDate.replace(/-/g, '')}`)
    }
    lines.push(`STATUS:${todo.completed ? 'COMPLETED' : 'NEEDS-ACTION'}`)
    lines.push('END:VTODO')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportLuminaIcs(events: CalendarEvent[], todos: TodoItem[]): void {
  const content = buildIcsCalendar(events, todos)
  downloadIcs(`lumina-memo-${toDateKey(new Date())}.ics`, content)
}
