export type ViewMode = 'day' | 'week'

export type ItemColor = 'teal' | 'sky' | 'amber' | 'rose' | 'slate'

export type RecurrenceFreq = 'none' | 'daily' | 'weekly' | 'custom'

export interface RecurrenceRule {
  freq: RecurrenceFreq
  /** 每 N 天 / 周 */
  interval: number
  /** 结束日期 yyyy-MM-dd，null 表示无限（展示窗口内展开） */
  until: string | null
  /** 排除的日期（只改这一次时写入） */
  exdates: string[]
}

export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO
  end: string // ISO
  allDay: boolean
  color: ItemColor
  note: string
  completed: boolean
  recurrence: RecurrenceRule
  /** 开始前多少分钟提醒，null 表示不提醒 */
  remindMinutes: number | null
  createdAt: string
  updatedAt: string
}

/** 展开后的单次出现（用于视图渲染） */
export interface EventOccurrence {
  event: CalendarEvent
  occurrenceId: string
  start: Date
  end: Date
  isOccurrence: boolean
}

export interface LaidOutOccurrence extends EventOccurrence {
  col: number
  colCount: number
}

export interface TodoItem {
  id: string
  title: string
  dueDate: string | null // yyyy-MM-dd
  completed: boolean
  color: ItemColor
  note: string
  /** 越小越靠前（优先级越高） */
  order: number
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

export type RecurrenceScope = 'this' | 'all'

export interface PendingMove {
  eventId: string
  occurrenceDayKey: string
  start: string
  end: string
}

export const DEFAULT_RECURRENCE: RecurrenceRule = {
  freq: 'none',
  interval: 1,
  until: null,
  exdates: [],
}
