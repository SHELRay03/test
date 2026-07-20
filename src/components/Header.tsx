import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store'
import { shiftDay } from '../utils/date'
import { exportLuminaIcs } from '../utils/ics'
import { ensureNotificationPermission } from '../utils/reminders'
import { searchItems, type SearchHit, uniqueDayKey } from '../utils/search'
import { downloadJsonBackup, parseBackupJson, pickBackupFile } from '../utils/backup'
import { DateNav } from './DateNav'

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
  const replaceAllData = useAppStore((s) => s.replaceAllData)

  async function importBackup() {
    const file = await pickBackupFile()
    if (!file) return
    try {
      const text = await file.text()
      const backup = parseBackupJson(text)
      const ok = window.confirm(
        `将用备份覆盖当前全部数据（事件 ${backup.events.length}、待办 ${backup.todos.length}）。确定吗？`,
      )
      if (!ok) return
      await replaceAllData(backup)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '恢复失败')
    }
  }

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

        <DateNav
          viewMode={viewMode}
          anchorDate={anchorDate}
          onSelect={setAnchorDate}
          onToday={() => setAnchorDate(new Date())}
          onShift={(delta) => setAnchorDate(shiftDay(anchorDate, delta))}
        />

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
          <DataMenu
            onBackup={() => downloadJsonBackup(events, todos)}
            onRestore={() => void importBackup()}
            onIcs={() => exportLuminaIcs(events, todos)}
            onRemind={() => void ensureNotificationPermission()}
          />
          <button
            type="button"
            className="ghost-btn compact"
            onClick={() => openEditor({ kind: 'todo', id: null })}
          >
            + 待办
          </button>
          <button
            type="button"
            className="primary-btn compact"
            onClick={() => openEditor({ kind: 'event', id: null })}
          >
            + 事件
          </button>
        </div>
      </div>
    </header>
  )
}

function DataMenu({
  onBackup,
  onRestore,
  onIcs,
  onRemind,
}: {
  onBackup: () => void
  onRestore: () => void
  onIcs: () => void
  onRemind: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        type="button"
        className="ghost-btn compact"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        数据 ▾
      </button>
      {open && (
        <div className="menu-panel" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onBackup()
              setOpen(false)
            }}
          >
            导出备份
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onRestore()
              setOpen(false)
            }}
          >
            恢复备份
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onIcs()
              setOpen(false)
            }}
          >
            导出 ICS
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onRemind()
              setOpen(false)
            }}
          >
            提醒权限
          </button>
        </div>
      )}
    </div>
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

  function runSearch() {
    const q = query.trim()
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
        placeholder="搜索…"
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
