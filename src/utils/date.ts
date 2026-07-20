import {
  addDays,
  addMinutes,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

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

export function eventOverlapsDay(
  startISO: string,
  endISO: string,
  day: Date,
): boolean {
  const start = parseISO(startISO)
  const end = parseISO(endISO)
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

export const HOUR_START = 6
export const HOUR_END = 23
export const PX_PER_MINUTE = 1.2
export const TIMELINE_MINUTES = (HOUR_END - HOUR_START) * 60
export const TIMELINE_HEIGHT = TIMELINE_MINUTES * PX_PER_MINUTE
