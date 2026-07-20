import { useAppStore } from '../store'

export function RecurrenceScopeDialog() {
  const pendingMove = useAppStore((s) => s.pendingMove)
  const resolvePendingMove = useAppStore((s) => s.resolvePendingMove)
  const cancelPendingMove = useAppStore((s) => s.cancelPendingMove)

  if (!pendingMove) return null

  return (
    <div className="scope-backdrop" role="presentation" onClick={cancelPendingMove}>
      <div
        className="scope-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scope-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="scope-title">修改重复事件</h3>
        <p>这是重复系列中的一次，要如何应用这次拖拽？</p>
        <div className="scope-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => void resolvePendingMove('this')}
          >
            只改这一次
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => void resolvePendingMove('all')}
          >
            改全部
          </button>
          <button type="button" className="ghost-btn" onClick={cancelPendingMove}>
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
