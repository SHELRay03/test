import type { CalendarEvent } from '../types'
import { expandEventsInRange, nowISO, parseISO } from './date'

const notified = new Set<string>()

function notifyKey(occurrenceId: string, remindAt: number): string {
  return `${occurrenceId}@${remindAt}`
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export function checkEventReminders(events: CalendarEvent[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const now = Date.now()
  const horizon = new Date(now + 48 * 60 * 60 * 1000)
  const past = new Date(now - 60 * 60 * 1000)
  const occurrences = expandEventsInRange(events, past, horizon)

  for (const occ of occurrences) {
    const minutes = occ.event.remindMinutes
    if (minutes == null || occ.event.completed) continue
    const remindAt = occ.start.getTime() - minutes * 60_000
    // 窗口：提醒时刻起 90 秒内触发，避免漏掉或重复轰炸
    if (now < remindAt || now - remindAt > 90_000) continue
    const key = notifyKey(occ.occurrenceId, remindAt)
    if (notified.has(key)) continue
    notified.add(key)

    const when = occ.start.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
    try {
      new Notification('Lumina Memo 提醒', {
        body: `${occ.event.title} · ${when} 开始`,
        tag: key,
        silent: false,
      })
    } catch {
      // 忽略通知失败
    }
  }
}

export function startReminderLoop(getEvents: () => CalendarEvent[]): () => void {
  const tick = () => checkEventReminders(getEvents())
  tick()
  const id = window.setInterval(tick, 30_000)
  return () => window.clearInterval(id)
}

export function formatReminderLabel(minutes: number | null): string {
  if (minutes == null) return '不提醒'
  if (minutes === 0) return '开始时'
  if (minutes < 60) return `提前 ${minutes} 分钟`
  if (minutes % 60 === 0) return `提前 ${minutes / 60} 小时`
  return `提前 ${minutes} 分钟`
}

export { parseISO, nowISO }
