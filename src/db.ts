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
    this.version(4)
      .stores({
        events: 'id, start, end, completed',
        todos: 'id, dueDate, completed, order',
      })
      .upgrade(async (tx) => {
        const table = tx.table('todos')
        const all = await table.toArray()
        all.sort(
          (a, b) =>
            String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')),
        )
        await Promise.all(
          all.map((todo, index) =>
            table.update(todo.id, { order: todo.order ?? index }),
          ),
        )
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

export function normalizeTodo(raw: TodoItem): TodoItem {
  return {
    ...raw,
    order: typeof raw.order === 'number' ? raw.order : Date.parse(raw.createdAt) || 0,
  }
}
