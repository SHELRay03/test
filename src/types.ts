export type ViewMode = 'day' | 'week'

export type ItemColor = 'teal' | 'sky' | 'amber' | 'rose' | 'slate'

export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO
  end: string // ISO
  allDay: boolean
  color: ItemColor
  note: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface TodoItem {
  id: string
  title: string
  dueDate: string | null // yyyy-MM-dd
  completed: boolean
  color: ItemColor
  note: string
  createdAt: string
  updatedAt: string
}

export type EditorTarget =
  | { kind: 'event'; id: string | null }
  | { kind: 'todo'; id: string | null }
  | null

export interface DisplayFilters {
  showEvents: boolean
  showTodos: boolean
}
