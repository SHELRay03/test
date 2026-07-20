import { create } from 'zustand'
import { db, normalizeEvent } from './db'
import type {
  CalendarEvent,
  DisplayFilters,
  EditorTarget,
  ItemColor,
  RecurrenceRule,
  TodoItem,
  ViewMode,
} from './types'
import { DEFAULT_RECURRENCE } from './types'
import { defaultEventRange, nowISO, toDateKey, uid } from './utils/date'

interface AppState {
  ready: boolean
  viewMode: ViewMode
  anchorDate: Date
  filters: DisplayFilters
  events: CalendarEvent[]
  todos: TodoItem[]
  editor: EditorTarget
  hydrate: () => Promise<void>
  setViewMode: (mode: ViewMode) => void
  setAnchorDate: (date: Date) => void
  setFilters: (partial: Partial<DisplayFilters>) => void
  openEditor: (target: NonNullable<EditorTarget>) => void
  closeEditor: () => void
  upsertEvent: (input: Partial<CalendarEvent> & { title: string }) => Promise<string>
  deleteEvent: (id: string) => Promise<void>
  upsertTodo: (input: Partial<TodoItem> & { title: string }) => Promise<string>
  deleteTodo: (id: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  toggleEventCompleted: (id: string) => Promise<void>
  moveEventTimes: (
    id: string,
    start: Date,
    end: Date,
  ) => Promise<void>
}

async function loadAll() {
  const [rawEvents, todos] = await Promise.all([
    db.events.toArray(),
    db.todos.toArray(),
  ])
  return { events: rawEvents.map(normalizeEvent), todos }
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  viewMode: 'day',
  anchorDate: startOfLocalDay(new Date()),
  filters: { showEvents: true, showTodos: true },
  events: [],
  todos: [],
  editor: null,

  hydrate: async () => {
    const data = await loadAll()
    if (data.events.length === 0 && data.todos.length === 0) {
      await seedDemo()
      const seeded = await loadAll()
      set({ ...seeded, ready: true })
      return
    }
    set({ ...data, ready: true })
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setAnchorDate: (date) => set({ anchorDate: startOfLocalDay(date) }),
  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),
  openEditor: (target) => set({ editor: target }),
  closeEditor: () => set({ editor: null }),

  upsertEvent: async (input) => {
    const now = nowISO()
    const id = input.id ?? uid()
    const existing = input.id
      ? get().events.find((e) => e.id === input.id)
      : undefined
    const range = defaultEventRange(get().anchorDate)
    const recurrence: RecurrenceRule =
      input.recurrence ?? existing?.recurrence ?? { ...DEFAULT_RECURRENCE }
    const event: CalendarEvent = {
      id,
      title: input.title.trim() || '未命名事件',
      start: input.start ?? existing?.start ?? range.start.toISOString(),
      end: input.end ?? existing?.end ?? range.end.toISOString(),
      allDay: input.allDay ?? existing?.allDay ?? false,
      color: (input.color ?? existing?.color ?? 'teal') as ItemColor,
      note: input.note ?? existing?.note ?? '',
      completed: input.completed ?? existing?.completed ?? false,
      recurrence,
      remindMinutes:
        input.remindMinutes !== undefined
          ? input.remindMinutes
          : (existing?.remindMinutes ?? null),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.events.put(event)
    const events = (await db.events.toArray()).map(normalizeEvent)
    set({ events })
    return id
  },

  deleteEvent: async (id) => {
    await db.events.delete(id)
    const events = (await db.events.toArray()).map(normalizeEvent)
    set({ events, editor: null })
  },

  upsertTodo: async (input) => {
    const now = nowISO()
    const id = input.id ?? uid()
    const existing = input.id
      ? get().todos.find((t) => t.id === input.id)
      : undefined
    const todo: TodoItem = {
      id,
      title: input.title.trim() || '未命名待办',
      dueDate:
        input.dueDate !== undefined
          ? input.dueDate
          : (existing?.dueDate ?? toDateKey(get().anchorDate)),
      completed: input.completed ?? existing?.completed ?? false,
      color: (input.color ?? existing?.color ?? 'amber') as ItemColor,
      note: input.note ?? existing?.note ?? '',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.todos.put(todo)
    const todos = await db.todos.toArray()
    set({ todos })
    return id
  },

  deleteTodo: async (id) => {
    await db.todos.delete(id)
    const todos = await db.todos.toArray()
    set({ todos, editor: null })
  },

  toggleTodo: async (id) => {
    const todo = get().todos.find((t) => t.id === id)
    if (!todo) return
    await get().upsertTodo({ ...todo, completed: !todo.completed })
  },

  toggleEventCompleted: async (id) => {
    const event = get().events.find((e) => e.id === id)
    if (!event) return
    await get().upsertEvent({ ...event, completed: !event.completed })
  },

  moveEventTimes: async (id, start, end) => {
    const event = get().events.find((e) => e.id === id)
    if (!event) return
    // 重复事件：只改系列的时刻与时长，保留模板日期
    if (event.recurrence.freq !== 'none') {
      const oldStart = new Date(event.start)
      const nextStart = new Date(oldStart)
      nextStart.setHours(start.getHours(), start.getMinutes(), 0, 0)
      const duration = end.getTime() - start.getTime()
      const nextEnd = new Date(nextStart.getTime() + duration)
      await get().upsertEvent({
        ...event,
        start: nextStart.toISOString(),
        end: nextEnd.toISOString(),
      })
      return
    }
    await get().upsertEvent({
      ...event,
      start: start.toISOString(),
      end: end.toISOString(),
    })
  },
}))

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

async function seedDemo() {
  const today = startOfLocalDay(new Date())
  const mk = (h: number, m = 0) => {
    const d = new Date(today)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }
  const now = nowISO()
  await db.events.bulkAdd([
    {
      id: uid(),
      title: '晨间专注',
      start: mk(9),
      end: mk(10, 30),
      allDay: false,
      color: 'teal',
      note: '处理最重要的一件事',
      completed: false,
      recurrence: { ...DEFAULT_RECURRENCE },
      remindMinutes: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid(),
      title: '午后散步',
      start: mk(15),
      end: mk(15, 40),
      allDay: false,
      color: 'sky',
      note: '',
      completed: false,
      recurrence: { freq: 'weekly', interval: 1, until: null },
      remindMinutes: null,
      createdAt: now,
      updatedAt: now,
    },
  ])
  await db.todos.bulkAdd([
    {
      id: uid(),
      title: '整理本周笔记',
      dueDate: toDateKey(today),
      completed: false,
      color: 'amber',
      note: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid(),
      title: '回复重要邮件',
      dueDate: toDateKey(today),
      completed: false,
      color: 'rose',
      note: '',
      createdAt: now,
      updatedAt: now,
    },
  ])
}
