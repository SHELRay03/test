import { useAppStore } from '../store'
import type { TodoItem } from '../types'
import { todoOnDay } from '../utils/date'

export function TodoSection({ day }: { day: Date }) {
  const todos = useAppStore((s) => s.todos)
  const showTodos = useAppStore((s) => s.filters.showTodos)
  const toggleTodo = useAppStore((s) => s.toggleTodo)
  const openEditor = useAppStore((s) => s.openEditor)

  if (!showTodos) return null

  const list = todos
    .filter((t) => todoOnDay(t.dueDate, day))
    .sort((a, b) => Number(a.completed) - Number(b.completed))

  return (
    <section className="todo-section" aria-label="今日待办">
      <div className="section-head">
        <h2>今日待办</h2>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => openEditor({ kind: 'todo', id: null })}
        >
          添加
        </button>
      </div>
      {list.length === 0 ? (
        <p className="empty-hint">今天还没有待办，点「添加」写下一件小事。</p>
      ) : (
        <ul className="todo-list">
          {list.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onToggle={() => void toggleTodo(todo.id)}
              onOpen={() => openEditor({ kind: 'todo', id: todo.id })}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function TodoRow({
  todo,
  onToggle,
  onOpen,
}: {
  todo: TodoItem
  onToggle: () => void
  onOpen: () => void
}) {
  return (
    <li className={`todo-item color-${todo.color} ${todo.completed ? 'done' : ''}`}>
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
