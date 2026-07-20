import { useAppStore } from '../store'

export function EmptyState() {
  const openEditor = useAppStore((s) => s.openEditor)
  const loadDemoData = useAppStore((s) => s.loadDemoData)

  return (
    <section className="empty-state" aria-label="开始使用">
      <h2 className="empty-state-title">还没有安排</h2>
      <p className="empty-state-desc">
        先记下今天要做的一件事，或放一个有时间的事件到时间轴上。
      </p>
      <div className="empty-state-actions">
        <button
          type="button"
          className="primary-btn"
          onClick={() => openEditor({ kind: 'event', id: null })}
        >
          新建事件
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => openEditor({ kind: 'todo', id: null })}
        >
          新建待办
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => void loadDemoData()}
        >
          加载示例
        </button>
      </div>
    </section>
  )
}
