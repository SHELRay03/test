import { useAppStore } from '../store'
import { formatDayLabel, formatMonthDay, getWeekDays, shiftDay } from '../utils/date'

export function Header() {
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const anchorDate = useAppStore((s) => s.anchorDate)
  const setAnchorDate = useAppStore((s) => s.setAnchorDate)
  const filters = useAppStore((s) => s.filters)
  const setFilters = useAppStore((s) => s.setFilters)
  const openEditor = useAppStore((s) => s.openEditor)

  const label =
    viewMode === 'day'
      ? formatDayLabel(anchorDate)
      : `${formatMonthDay(getWeekDays(anchorDate)[0])} – ${formatMonthDay(getWeekDays(anchorDate)[6])}`

  const step = viewMode === 'day' ? 1 : 7

  return (
    <header>
      <div className="brand-block">
        <div>
          <h1 className="brand-title">
            Lumina <em>Memo</em>
          </h1>
          <p className="brand-tagline">看清今天，轻轻安排接下来的事。</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="视图切换">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'day'}
            className={viewMode === 'day' ? 'active' : ''}
            onClick={() => setViewMode('day')}
          >
            日
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'week'}
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => setViewMode('week')}
          >
            周
          </button>
        </div>

        <div className="nav-row">
          <button
            type="button"
            className="icon-btn"
            aria-label="上一段"
            onClick={() => setAnchorDate(shiftDay(anchorDate, -step))}
          >
            ‹
          </button>
          <div className="date-label">{label}</div>
          <button
            type="button"
            className="icon-btn"
            aria-label="下一段"
            onClick={() => setAnchorDate(shiftDay(anchorDate, step))}
          >
            ›
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setAnchorDate(new Date())}
          >
            今天
          </button>
        </div>

        <div className="filters" aria-label="显示筛选">
          <label className="filter-check">
            <input
              type="checkbox"
              checked={filters.showEvents}
              onChange={(e) => setFilters({ showEvents: e.target.checked })}
            />
            事件
          </label>
          <label className="filter-check">
            <input
              type="checkbox"
              checked={filters.showTodos}
              onChange={(e) => setFilters({ showTodos: e.target.checked })}
            />
            待办
          </label>
        </div>

        <div className="fab-row">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => openEditor({ kind: 'todo', id: null })}
          >
            + 待办
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() => openEditor({ kind: 'event', id: null })}
          >
            + 事件
          </button>
        </div>
      </div>
    </header>
  )
}
