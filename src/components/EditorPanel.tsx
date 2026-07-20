import { format, parseISO } from 'date-fns'
import { useEffect, useState } from 'react'
import { useAppStore } from '../store'
import type { ItemColor } from '../types'
import { toDateKey } from '../utils/date'

const COLORS: { value: ItemColor; label: string }[] = [
  { value: 'teal', label: '青绿' },
  { value: 'sky', label: '晴空' },
  { value: 'amber', label: '琥珀' },
  { value: 'rose', label: '玫褐' },
  { value: 'slate', label: '岩灰' },
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
      await upsertEvent({
        id: editor!.id ?? undefined,
        title,
        note,
        color,
        completed,
        start: fromLocalInput(startLocal),
        end: fromLocalInput(endLocal),
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
      <button
        type="button"
        className="editor-backdrop"
        aria-label="关闭编辑"
        onClick={closeEditor}
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
          <div className="row-2">
            <div className="field">
              <label htmlFor="start">开始</label>
              <input
                id="start"
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="end">结束</label>
              <input
                id="end"
                type="datetime-local"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
              />
            </div>
          </div>
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
          <label htmlFor="color">颜色</label>
          <select
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value as ItemColor)}
          >
            {COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
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
