import { create } from 'zustand'
import { db, normalizeEvent, normalizeTodo } from './db'
import type {
  CalendarEvent,
  DisplayFilters,
  EditorTarget,
  ItemColor,
  PendingMove,
  RecurrenceRule,
  RecurrenceScope,
  TodoItem,
  ViewMode,
} from './types'
import { DEFAULT_RECURRENCE } from './types'
import type { LuminaBackup } from './utils/backup'
import { defaultEventRange, nowISO, toDateKey, uid } from './utils/date'

interface AppState {
  ready: boolean
  viewMode: ViewMode
  anchorDate: Date
  filters: DisplayFilters
  events: CalendarEvent[]
  todos: TodoItem[]
  editor: EditorTarget
  pendingMove: PendingMove | null
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
  reorderTodos: (orderedIds: string[]) => Promise<void>
  requestMoveEvent: (
    eventId: string,
    occurrenceDay: Date,
    start: Date,
    end: Date,
  ) => Promise<void>
  resolvePendingMove: (scope: RecurrenceScope) => Promise<void>
  cancelPendingMove: () => void
  replaceAllData: (backup: LuminaBackup) => Promise<void>
  loadDemoData: () => Promise<void>
}

async function loadAll() {
  const [rawEvents, rawTodos] = await Promise.all([
    db.events.toArray(),
    db.todos.toArray(),
  ])
  return {
    events: rawEvents.map(normalizeEvent),
    todos: rawTodos.map(normalizeTodo),
  }
}

async function refresh(set: (partial: Partial<AppState>) => void) {
  const data = await loadAll()
  set(data)
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  viewMode: 'day',
  anchorDate: startOfLocalDay(new Date()),
  filters: { showEvents: true, showTodos: true },
  events: [],
  todos: [],
  editor: null,
  pendingMove: null,

  hydrate: async () => {
    const data = await loadAll()
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
    const recurrence: RecurrenceRule = {
      ...DEFAULT_RECURRENCE,
      ...(input.recurrence ?? existing?.recurrence ?? DEFAULT_RECURRENCE),
      exdates:
        input.recurrence?.exdates ??
        existing?.recurrence?.exdates ??
        [],
    }
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
    await refresh(set)
    return id
  },

  deleteEvent: async (id) => {
    await db.events.delete(id)
    await refresh(set)
    set({ editor: null })
  },

  upsertTodo: async (input) => {
    const now = nowISO()
    const id = input.id ?? uid()
    const existing = input.id
      ? get().todos.find((t) => t.id === input.id)
      : undefined
    const maxOrder = get().todos.reduce((m, t) => Math.max(m, t.order ?? 0), -1)
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
      order:
        input.order ??
        existing?.order ??
        maxOrder + 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.todos.put(todo)
    await refresh(set)
    return id
  },

  deleteTodo: async (id) => {
    await db.todos.delete(id)
    await refresh(set)
    set({ editor: null })
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

  reorderTodos: async (orderedIds) => {
    const now = nowISO()
    const byId = new Map(get().todos.map((t) => [t.id, t]))
    const updates: TodoItem[] = []
    orderedIds.forEach((id, index) => {
      const todo = byId.get(id)
      if (!todo) return
      if (todo.order === index) return
      updates.push({ ...todo, order: index, updatedAt: now })
    })
    if (updates.length === 0) return
    await db.todos.bulkPut(updates)
    await refresh(set)
  },

  requestMoveEvent: async (eventId, occurrenceDay, start, end) => {
    const event = get().events.find((e) => e.id === eventId)
    if (!event) return
    if (event.recurrence.freq !== 'none') {
      set({
        pendingMove: {
          eventId,
          occurrenceDayKey: toDateKey(occurrenceDay),
          start: start.toISOString(),
          end: end.toISOString(),
        },
      })
      return
    }
    await get().upsertEvent({
      ...event,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
    })
  },

  resolvePendingMove: async (scope) => {
    const pending = get().pendingMove
    if (!pending) return
    const event = get().events.find((e) => e.id === pending.eventId)
    set({ pendingMove: null })
    if (!event) return

    const start = new Date(pending.start)
    const end = new Date(pending.end)

    if (scope === 'all') {
      // 改全部：以新开始日为模板日，保留重复规则
      await get().upsertEvent({
        ...event,
        start: start.toISOString(),
        end: end.toISOString(),
        allDay: false,
      })
      return
    }

    // 只改这一次：排除原日，并新建单次事件
    const exdates = [...new Set([...(event.recurrence.exdates ?? []), pending.occurrenceDayKey])]
    await get().upsertEvent({
      ...event,
      recurrence: { ...event.recurrence, exdates },
    })
    await get().upsertEvent({
      title: event.title,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      color: event.color,
      note: event.note,
      completed: event.completed,
      recurrence: { ...DEFAULT_RECURRENCE },
      remindMinutes: event.remindMinutes,
    })
  },

  cancelPendingMove: () => set({ pendingMove: null }),

  replaceAllData: async (backup) => {
    await db.transaction('rw', db.events, db.todos, async () => {
      await db.events.clear()
      await db.todos.clear()
      if (backup.events.length) await db.events.bulkPut(backup.events.map(normalizeEvent))
      if (backup.todos.length)
        await db.todos.bulkPut(backup.todos.map(normalizeTodo))
    })
    await refresh(set)
  },

  loadDemoData: async () => {
    await seedDemo()
    await refresh(set)
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
  const existing = await db.events.count()
  if (existing > 0) return
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
      recurrence: { freq: 'weekly', interval: 1, until: null, exdates: [] },
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
      order: 0,
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
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
  ])
}
