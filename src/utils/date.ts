import {
  addDays,
  addMinutes,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isWithinInterval,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { CalendarEvent, EventOccurrence, RecurrenceRule } from '../types'
import { DEFAULT_RECURRENCE } from '../types'

export function uid(): string {
  return crypto.randomUUID()
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function formatDayLabel(date: Date): string {
  return format(date, 'M月d日 EEEE', { locale: zhCN })
}

export function formatShortDay(date: Date): string {
  return format(date, 'EEE', { locale: zhCN })
}

export function formatMonthDay(date: Date): string {
  return format(date, 'M/d')
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm')
}

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  const end = endOfWeek(anchor, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function defaultEventRange(anchor: Date): { start: Date; end: Date } {
  const base = setMinutes(setHours(anchor, 9), 0)
  return { start: base, end: addMinutes(base, 60) }
}

export function occurrenceOverlapsDay(
  start: Date,
  end: Date,
  day: Date,
): boolean {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)
  return start <= dayEnd && end >= dayStart
}

export function todoOnDay(dueDate: string | null, day: Date): boolean {
  if (!dueDate) return isSameDay(day, new Date())
  return dueDate === toDateKey(day)
}

export function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export function dateFromDayAndMinutes(day: Date, minutes: number): Date {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return setMinutes(setHours(startOfDay(day), h), m)
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function shiftDay(date: Date, delta: number): Date {
  return addDays(date, delta)
}

export function isInRange(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(date, { start, end })
}

export function snapMinutes(minutes: number, step = 15): number {
  return Math.round(minutes / step) * step
}

export function normalizeRecurrence(
  rule?: Partial<RecurrenceRule> | null,
): RecurrenceRule {
  return {
    freq: rule?.freq ?? DEFAULT_RECURRENCE.freq,
    interval: Math.max(1, rule?.interval ?? 1),
    until: rule?.until ?? null,
    exdates: rule?.exdates ?? [],
  }
}

function durationMs(event: CalendarEvent): number {
  return Math.max(parseISO(event.end).getTime() - parseISO(event.start).getTime(), 15 * 60_000)
}

function occurrenceStartOnDay(templateStart: Date, day: Date): Date {
  return dateFromDayAndMinutes(day, minutesFromMidnight(templateStart))
}

function stepDaysFor(rule: RecurrenceRule): number {
  if (rule.freq === 'weekly') return 7 * rule.interval
  // daily + custom(按天)
  return rule.interval
}

/** 在可见范围内展开重复事件 */
export function expandEventsInRange(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  const out: EventOccurrence[] = []
  const rangeFrom = startOfDay(rangeStart)
  const rangeTo = endOfDay(rangeEnd)

  for (const event of events) {
    const rule = normalizeRecurrence(event.recurrence)
    const templateStart = parseISO(event.start)
    const dur = durationMs(event)
    const until = rule.until ? endOfDay(parseISO(`${rule.until}T00:00:00`)) : null
    const templateDay = startOfDay(templateStart)

    if (rule.freq === 'none') {
      const end = parseISO(event.end)
      if (templateStart <= rangeTo && end >= rangeFrom) {
        out.push({
          event,
          occurrenceId: event.id,
          start: templateStart,
          end,
          isOccurrence: false,
        })
      }
      continue
    }

    const step = stepDaysFor(rule)
    let cursor = templateDay
    let guard = 0

    while (guard < 500) {
      if (until && isBefore(until, cursor)) break
      if (isBefore(rangeTo, cursor)) break

      if (!isBefore(cursor, rangeFrom) || occurrenceOverlapsDay(
        occurrenceStartOnDay(templateStart, cursor),
        new Date(occurrenceStartOnDay(templateStart, cursor).getTime() + dur),
        rangeFrom,
      )) {
        const dayKey = toDateKey(cursor)
        if (rule.exdates.includes(dayKey)) {
          cursor = addDays(cursor, step)
          guard++
          continue
        }
        const occStart = occurrenceStartOnDay(templateStart, cursor)
        const occEnd = new Date(occStart.getTime() + dur)
        if (occStart <= rangeTo && occEnd >= rangeFrom) {
          out.push({
            event,
            occurrenceId: `${event.id}::${dayKey}`,
            start: occStart,
            end: occEnd,
            isOccurrence: !isSameDay(cursor, templateDay),
          })
        }
      }

      cursor = addDays(cursor, step)
      guard++
    }
  }

  return out
}

export function eventsForDay(
  events: CalendarEvent[],
  day: Date,
): EventOccurrence[] {
  return expandEventsInRange(events, day, day).filter((o) =>
    occurrenceOverlapsDay(o.start, o.end, day),
  )
}

export function eventsForWeek(
  events: CalendarEvent[],
  weekDays: Date[],
): EventOccurrence[] {
  if (weekDays.length === 0) return []
  return expandEventsInRange(events, weekDays[0], weekDays[weekDays.length - 1])
}

export { addDays, parseISO, startOfDay, endOfDay }

export const HOUR_START = 6
export const HOUR_END = 23
export const PX_PER_MINUTE = 1.2
export const WEEK_PX = 0.9
export const TIMELINE_MINUTES = (HOUR_END - HOUR_START) * 60
export const TIMELINE_HEIGHT = TIMELINE_MINUTES * PX_PER_MINUTE
