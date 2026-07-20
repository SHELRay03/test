import { format, parseISO } from 'date-fns'
import { useEffect, useState } from 'react'
import { useAppStore } from '../store'
import type { ItemColor, RecurrenceFreq } from '../types'
import { DEFAULT_RECURRENCE } from '../types'
import { toDateKey } from '../utils/date'
import { ensureNotificationPermission } from '../utils/reminders'

const COLORS: { value: ItemColor; label: string }[] = [
  { value: 'teal', label: '青绿' },
  { value: 'sky', label: '晴空' },
  { value: 'amber', label: '琥珀' },
  { value: 'rose', label: '玫褐' },
  { value: 'slate', label: '岩灰' },
]

const REMIND_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: '不提醒' },
  { value: 0, label: '开始时' },
  { value: 5, label: '提前 5 分钟' },
  { value: 10, label: '提前 10 分钟' },
  { value: 30, label: '提前 30 分钟' },
  { value: 60, label: '提前 1 小时' },
]

export function EditorPanel() {
  const editor = useAppStore((s) => s.editor)
  const events = useAppStore((s) => s.events)
  const todos = useAppStore((s) => s.todos)
  const anchorDate = useAppStore((s) => s.anchorDate)
  const closeEditor = useAppStore((s) => s.closeEditor)
  const upsertEvent = useAppStore((s) => s.upsertEvent)
  const deleteEvent = useAppStore((s) => s.deleteEvent)
  const upsertTodo = useAppStore((s) => s.upsertTodo)
  const deleteTodo = useAppStore((s) => s.deleteTodo)

  const existingEvent =
    editor?.kind === 'event' && editor.id
      ? events.find((e) => e.id === editor.id)
      : undefined
  const existingTodo =
    editor?.kind === 'todo' && editor.id
      ? todos.find((t) => t.id === editor.id)
      : undefined

  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [color, setColor] = useState<ItemColor>('teal')
  const [startLocal, setStartLocal] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [completed, setCompleted] = useState(false)
  const [freq, setFreq] = useState<RecurrenceFreq>('none')
  const [interval, setInterval] = useState(1)
  const [until, setUntil] = useState('')
  const [remindMinutes, setRemindMinutes] = useState<number | null>(null)
  const [allDay, setAllDay] = useState(false)

  useEffect(() => {
    if (!editor) return
    if (editor.kind === 'event') {
      const base = existingEvent
      const start = base ? parseISO(base.start) : defaultStart(anchorDate)
      const end = base ? parseISO(base.end) : defaultEnd(anchorDate)
      setTitle(base?.title ?? '')
      setNote(base?.note ?? '')
      setColor(base?.color ?? 'teal')
      setCompleted(base?.completed ?? false)
      setStartLocal(toLocalInput(start))
      setEndLocal(toLocalInput(end))
      const r = base?.recurrence ?? DEFAULT_RECURRENCE
      setFreq(r.freq)
      setInterval(r.interval)
      setUntil(r.until ?? '')
      setRemindMinutes(base?.remindMinutes ?? null)
      setAllDay(base?.allDay ?? false)
    } else {
      setTitle(existingTodo?.title ?? '')
      setNote(existingTodo?.note ?? '')
      setColor(existingTodo?.color ?? 'amber')
      setCompleted(existingTodo?.completed ?? false)
      setDueDate(existingTodo?.dueDate ?? toDateKey(anchorDate))
    }
  }, [editor, existingEvent, existingTodo, anchorDate])

  if (!editor) return null

  const isEvent = editor.kind === 'event'
  const isNew = editor.id === null

  async function save() {
    if (isEvent) {
      if (remindMinutes != null) {
        await ensureNotificationPermission()
      }
      await upsertEvent({
        id: editor!.id ?? undefined,
        title,
        note,
        color,
        completed,
        allDay,
        start: fromLocalInput(startLocal),
        end: fromLocalInput(endLocal),
        recurrence: {
          freq,
          interval: Math.max(1, interval),
          until: until || null,
          exdates: existingEvent?.recurrence?.exdates ?? [],
        },
        remindMinutes,
      })
    } else {
      await upsertTodo({
        id: editor!.id ?? undefined,
        title,
        note,
        color,
        completed,
        dueDate: dueDate || null,
      })
    }
    closeEditor()
  }

  async function remove() {
    if (!editor?.id) return
    if (isEvent) await deleteEvent(editor.id)
    else await deleteTodo(editor.id)
  }

  return (
    <>
      <div
        className="editor-backdrop"
        role="presentation"
        onClick={closeEditor}
        onKeyDown={(e) => {
          if (e.key === 'Escape') closeEditor()
        }}
      />
      <aside className="editor-panel" role="dialog" aria-modal="true">
        <h2>{isNew ? (isEvent ? '新事件' : '新待办') : isEvent ? '编辑事件' : '编辑待办'}</h2>

        <div className="field">
          <label htmlFor="title">标题</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isEvent ? '例如：晨间专注' : '例如：整理笔记'}
            autoFocus
          />
        </div>

        {isEvent ? (
          <>
            <div className="datetime-stack">
              <div className="field">
                <label htmlFor="start">开始</label>
                <input
                  id="start"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  disabled={allDay}
                />
              </div>
              <div className="field">
                <label htmlFor="end">结束</label>
                <input
                  id="end"
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  disabled={allDay}
                />
              </div>
            </div>

            <label className="filter-check">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
              />
              全天事件
            </label>

            <div className="field">
              <label htmlFor="freq">重复</label>
              <select
                id="freq"
                value={freq}
                onChange={(e) => setFreq(e.target.value as RecurrenceFreq)}
              >
                <option value="none">不重复</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="custom">自定义间隔（天）</option>
              </select>
            </div>

            {freq !== 'none' && (
              <div className="datetime-stack">
                <div className="field">
                  <label htmlFor="interval">
                    {freq === 'weekly' ? '每几周' : '每几天'}
                  </label>
                  <input
                    id="interval"
                    type="number"
                    min={1}
                    max={365}
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="until">结束于（可选）</label>
                  <input
                    id="until"
                    type="date"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="field">
              <label htmlFor="remind">提醒</label>
              <select
                id="remind"
                value={remindMinutes === null ? 'null' : String(remindMinutes)}
                onChange={(e) => {
                  const v = e.target.value
                  setRemindMinutes(v === 'null' ? null : Number(v))
                }}
              >
                {REMIND_OPTIONS.map((o) => (
                  <option
                    key={String(o.value)}
                    value={o.value === null ? 'null' : String(o.value)}
                  >
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="field">
            <label htmlFor="due">截止日期</label>
            <input
              id="due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        )}

        <div className="field">
          <span className="field-label" id="color-label">
            颜色
          </span>
          <div className="color-swatches" role="radiogroup" aria-labelledby="color-label">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={color === c.value}
                aria-label={c.label}
                title={c.label}
                className={`color-swatch color-${c.value} ${color === c.value ? 'selected' : ''}`}
                onClick={() => setColor(c.value)}
              >
                <span className="swatch-dot" />
                <span className="swatch-name">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="note">备注</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="可选"
          />
        </div>

        <div className="editor-footer">
          <label className="filter-check">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
            />
            已完成
          </label>
          <div className="editor-actions">
            <button type="button" className="primary-btn" onClick={() => void save()}>
              保存
            </button>
            <button type="button" className="ghost-btn" onClick={closeEditor}>
              取消
            </button>
            {!isNew && (
              <button type="button" className="danger-btn" onClick={() => void remove()}>
                删除
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

function toLocalInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

function fromLocalInput(value: string): string {
  return new Date(value).toISOString()
}

function defaultStart(day: Date): Date {
  const d = new Date(day)
  d.setHours(9, 0, 0, 0)
  return d
}

function defaultEnd(day: Date): Date {
  const d = new Date(day)
  d.setHours(10, 0, 0, 0)
  return d
}
