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
    this.version(3)
      .stores({
        events: 'id, start, end, completed',
        todos: 'id, dueDate, completed',
      })
      .upgrade(async (tx) => {
        await tx
          .table('events')
          .toCollection()
          .modify((event: Partial<CalendarEvent>) => {
            if (!event.recurrence) {
              event.recurrence = { ...DEFAULT_RECURRENCE }
            } else if (!event.recurrence.exdates) {
              event.recurrence = { ...event.recurrence, exdates: [] }
            }
            if (event.allDay === undefined) event.allDay = false
          })
      })
  }
}

export const db = new LuminaDB()

export function normalizeEvent(raw: CalendarEvent): CalendarEvent {
  return {
    ...raw,
    allDay: Boolean(raw.allDay),
    recurrence: {
      ...DEFAULT_RECURRENCE,
      ...raw.recurrence,
      exdates: raw.recurrence?.exdates ?? [],
    },
    remindMinutes: raw.remindMinutes ?? null,
  }
}
