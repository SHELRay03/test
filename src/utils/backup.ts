import type { CalendarEvent, TodoItem } from '../types'
import { DEFAULT_RECURRENCE } from '../types'
import { toDateKey } from './date'

export interface LuminaBackup {
  version: 1
  exportedAt: string
  events: CalendarEvent[]
  todos: TodoItem[]
}

export function buildBackup(events: CalendarEvent[], todos: TodoItem[]): LuminaBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    events,
    todos,
  }
}

export function downloadJsonBackup(events: CalendarEvent[], todos: TodoItem[]): void {
  const data = buildBackup(events, todos)
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lumina-memo-backup-${toDateKey(new Date())}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseBackupJson(text: string): LuminaBackup {
  const raw = JSON.parse(text) as Partial<LuminaBackup>
  if (!raw || raw.version !== 1 || !Array.isArray(raw.events) || !Array.isArray(raw.todos)) {
    throw new Error('无效的备份文件')
  }
  return {
    version: 1,
    exportedAt: raw.exportedAt ?? new Date().toISOString(),
    events: raw.events.map((e) => ({
      ...e,
      recurrence: {
        ...DEFAULT_RECURRENCE,
        ...e.recurrence,
        exdates: e.recurrence?.exdates ?? [],
      },
      remindMinutes: e.remindMinutes ?? null,
      allDay: Boolean(e.allDay),
    })),
    todos: raw.todos,
  }
}

export function pickBackupFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
}
