import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store'
import { formatDayLabel, formatMonthDay, getWeekDays, shiftDay } from '../utils/date'
import { exportLuminaIcs } from '../utils/ics'
import { ensureNotificationPermission } from '../utils/reminders'
import { searchItems, type SearchHit, uniqueDayKey } from '../utils/search'

export function Header() {
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const anchorDate = useAppStore((s) => s.anchorDate)
  const setAnchorDate = useAppStore((s) => s.setAnchorDate)
  const filters = useAppStore((s) => s.filters)
  const setFilters = useAppStore((s) => s.setFilters)
  const openEditor = useAppStore((s) => s.openEditor)
  const events = useAppStore((s) => s.events)
  const todos = useAppStore((s) => s.todos)

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
          <p className="brand-tagline">让每一束流光，都有迹可寻。</p>
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

        <SearchJump events={events} todos={todos} />

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
            title="导出 ICS"
            onClick={() => exportLuminaIcs(events, todos)}
          >
            导出
          </button>
          <button
            type="button"
            className="ghost-btn"
            title="开启浏览器提醒"
            onClick={() => void ensureNotificationPermission()}
          >
            提醒权限
          </button>
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

function SearchJump({
  events,
  todos,
}: {
  events: ReturnType<typeof useAppStore.getState>['events']
  todos: ReturnType<typeof useAppStore.getState>['todos']
}) {
  const setAnchorDate = useAppStore((s) => s.setAnchorDate)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const openEditor = useAppStore((s) => s.openEditor)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const hits = useMemo(
    () => searchItems(query, events, todos),
    [query, events, todos],
  )

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function goToHit(hit: SearchHit) {
    setAnchorDate(hit.day)
    setViewMode('day')
    openEditor({ kind: hit.kind, id: hit.id })
    setOpen(false)
    setMessage('')
    setQuery('')
  }

  function runSearch(nextQuery = query) {
    const q = nextQuery.trim()
    if (!q) {
      setOpen(false)
      setMessage('')
      return
    }
    const results = searchItems(q, events, todos)
    if (results.length === 0) {
      setOpen(true)
      setMessage('没有找到匹配的事件或待办')
      setActiveIndex(0)
      return
    }

    if (results.length === 1) {
      goToHit(results[0])
      return
    }

    const oneDay = uniqueDayKey(results)
    setOpen(true)
    setMessage(
      oneDay
        ? `找到 ${results.length} 条，请选择`
        : `找到 ${results.length} 条，分布在多天，请选择`,
    )
    setActiveIndex(0)
  }

  return (
    <div className="search-box" ref={wrapRef}>
      <label className="sr-only" htmlFor="lumina-search">
        搜索并跳转
      </label>
      <input
        id="lumina-search"
        type="search"
        placeholder="输入关键词，回车跳转…"
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value)
          setMessage('')
          if (!e.target.value.trim()) setOpen(false)
        }}
        onFocus={() => {
          if (hits.length > 1 || message) setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false)
            ;(e.target as HTMLInputElement).blur()
            return
          }
          if (e.key === 'ArrowDown' && open && hits.length) {
            e.preventDefault()
            setActiveIndex((i) => Math.min(i + 1, hits.length - 1))
            return
          }
          if (e.key === 'ArrowUp' && open && hits.length) {
            e.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
            return
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            if (open && hits.length > 0) {
              goToHit(hits[activeIndex] ?? hits[0])
              return
            }
            runSearch()
          }
        }}
      />
      {open && (
        <div className="search-results" role="listbox" aria-label="搜索结果">
          {message && <p className="search-results-meta">{message}</p>}
          {hits.length > 0 &&
            hits.map((hit, index) => (
              <button
                key={`${hit.kind}-${hit.id}-${hit.dayKey}-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`search-result-item ${index === activeIndex ? 'active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => goToHit(hit)}
              >
                <span className={`search-kind ${hit.kind}`}>
                  {hit.kind === 'event' ? '事件' : '待办'}
                </span>
                <span className="search-title">{hit.title}</span>
                <span className="search-time">{hit.timeLabel}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
