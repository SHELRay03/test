import Dexie, { type EntityTable } from 'dexie'
import type { CalendarEvent, TodoItem } from './types'

class LuminaDB extends Dexie {
  events!: EntityTable<CalendarEvent, 'id'>
  todos!: EntityTable<TodoItem, 'id'>

  constructor() {
    super('lumina-memo')
    this.version(1).stores({
      events: 'id, start, end, completed',
      todos: 'id, dueDate, completed',
    })
  }
}

export const db = new LuminaDB()
