import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store'
import type { TodoItem } from '../types'
import { todoOnDay } from '../utils/date'

function sortTodos(list: TodoItem[]): TodoItem[] {
  return [...list].sort(
    (a, b) =>
      (a.order ?? 0) - (b.order ?? 0) ||
      Number(a.completed) - Number(b.completed) ||
      a.title.localeCompare(b.title, 'zh'),
  )
}

export function TodoSection({ day }: { day: Date }) {
  const todos = useAppStore((s) => s.todos)
  const showTodos = useAppStore((s) => s.filters.showTodos)
  const toggleTodo = useAppStore((s) => s.toggleTodo)
  const openEditor = useAppStore((s) => s.openEditor)
  const reorderTodos = useAppStore((s) => s.reorderTodos)

  const baseList = useMemo(
    () => sortTodos(todos.filter((t) => todoOnDay(t.dueDate, day))),
    [todos, day],
  )

  const [localList, setLocalList] = useState<TodoItem[]>(baseList)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const dragIdRef = useRef<string | null>(null)
  const listRef = useRef(baseList)
  listRef.current = localList

  useEffect(() => {
    if (!draggingId) setLocalList(baseList)
  }, [baseList, draggingId])

  if (!showTodos) return null

  function applyReorder(fromId: string, toId: string) {
    if (fromId === toId) return
    setLocalList((prev) => {
      const next = [...prev]
      const from = next.findIndex((t) => t.id === fromId)
      const to = next.findIndex((t) => t.id === toId)
      if (from < 0 || to < 0) return prev
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  function commitReorder() {
    const ids = listRef.current.map((t) => t.id)
    void reorderTodos(ids)
    setDraggingId(null)
    setOverId(null)
    dragIdRef.current = null
  }

  return (
    <section className="todo-section" aria-label="今日待办">
      <div className="section-head">
        <h2>今日待办</h2>
        <span className="hint-inline">拖动手柄调整优先级</span>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => openEditor({ kind: 'todo', id: null })}
        >
          添加
        </button>
      </div>
      {localList.length === 0 ? (
        <p className="empty-hint">今天还没有待办，点「添加」写下一件小事。</p>
      ) : (
        <ul className="todo-list">
          {localList.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              dragging={draggingId === todo.id}
              dragOver={overId === todo.id && draggingId !== todo.id}
              onToggle={() => void toggleTodo(todo.id)}
              onOpen={() => openEditor({ kind: 'todo', id: todo.id })}
              onDragStart={() => {
                dragIdRef.current = todo.id
                setDraggingId(todo.id)
              }}
              onDragEnter={() => {
                const from = dragIdRef.current
                if (!from || from === todo.id) return
                setOverId(todo.id)
                applyReorder(from, todo.id)
              }}
              onDragEnd={commitReorder}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function TodoRow({
  todo,
  dragging,
  dragOver,
  onToggle,
  onOpen,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: {
  todo: TodoItem
  dragging: boolean
  dragOver: boolean
  onToggle: () => void
  onOpen: () => void
  onDragStart: () => void
  onDragEnter: () => void
  onDragEnd: () => void
}) {
  return (
    <li
      className={`todo-item color-${todo.color} ${todo.completed ? 'done' : ''} ${dragging ? 'is-dragging' : ''} ${dragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        onDragEnter()
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDragEnd()
      }}
    >
      <button
        type="button"
        className="todo-handle"
        draggable
        aria-label="拖动调整优先级"
        title="上下拖动调整优先级"
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', todo.id)
          onDragStart()
        }}
        onDragEnd={onDragEnd}
      >
        ⋮⋮
      </button>
      <button
        type="button"
        className="check-btn"
        aria-label={todo.completed ? '标记未完成' : '标记完成'}
        aria-checked={todo.completed}
        role="checkbox"
        onClick={onToggle}
      >
        {todo.completed ? '✓' : ''}
      </button>
      <button type="button" className="todo-title" onClick={onOpen}>
        {todo.title}
      </button>
    </li>
  )
}
