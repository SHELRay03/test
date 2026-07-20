import Dexie, { type EntityTable } from 'dexie'
import type { CalendarEvent, TodoItem } from './types'
import { DEFAULT_RECURRENCE } from './types'

class LuminaDB extends Dexie {
  events!: EntityTable<CalendarEvent, 'id'>
  todos!: EntityTable<TodoItem, 'id'>

  constructor() {
    super('lumina-memo')
    this.version(1).stores({
      events: 'id, start, end, completed',
      todos: 'id, dueDate, completed',
    })
    this.version(2)
      .stores({
        events: 'id, start, end, completed',
        todos: 'id, dueDate, completed',
      })
      .upgrade(async (tx) => {
        await tx
          .table('events')
          .toCollection()
          .modify((event: Partial<CalendarEvent>) => {
            if (!event.recurrence) event.recurrence = { ...DEFAULT_RECURRENCE }
            if (event.remindMinutes === undefined) event.remindMinutes = null
          })
      })
  }
}

export const db = new LuminaDB()

export function normalizeEvent(raw: CalendarEvent): CalendarEvent {
  return {
    ...raw,
    recurrence: raw.recurrence ?? { ...DEFAULT_RECURRENCE },
    remindMinutes: raw.remindMinutes ?? null,
  }
}
