import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ViewMode } from '../types'
import { getWeekDays, toDateKey } from '../utils/date'
import { useFixedPopover } from '../utils/useFixedPopover'

interface Props {
  viewMode: ViewMode
  anchorDate: Date
  onSelect: (date: Date) => void
  onToday: () => void
  onShift: (delta: number) => void
}

export function DateNav({
  viewMode,
  anchorDate,
  onSelect,
  onToday,
  onShift,
}: Props) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(() => startOfMonth(anchorDate))
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const step = viewMode === 'day' ? 1 : 7
  const popoverStyle = useFixedPopover(open, triggerRef, 'start', 292)

  const label =
    viewMode === 'day'
      ? format(anchorDate, 'M月d日 EEE', { locale: zhCN })
      : (() => {
          const days = getWeekDays(anchorDate)
          return `${format(days[0], 'M/d')} – ${format(days[6], 'M/d')}`
        })()

  useEffect(() => {
    if (open) setCursor(startOfMonth(anchorDate))
  }, [open, anchorDate])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as Node
      if (wrapRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })
    const rows: Date[][] = []
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))
    return rows
  }, [cursor])

  const selectedWeekKeys = useMemo(() => {
    if (viewMode !== 'week') return new Set<string>()
    return new Set(getWeekDays(anchorDate).map((d) => toDateKey(d)))
  }, [viewMode, anchorDate])

  function pick(day: Date) {
    onSelect(day)
    setOpen(false)
  }

  return (
    <div className="date-nav" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label="上一段"
        onClick={() => onShift(-step)}
      >
        ‹
      </button>
      <button
        ref={triggerRef}
        type="button"
        className={`date-trigger ${open ? 'open' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={viewMode === 'week' ? '点击打开日历，选择某一周' : '点击打开日历，精确选择日期'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="date-trigger-text">{label}</span>
        <span className="date-trigger-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="下一段"
        onClick={() => onShift(step)}
      >
        ›
      </button>
      <button type="button" className="ghost-btn compact" onClick={onToday}>
        今天
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="date-popover is-fixed"
            role="dialog"
            aria-label="选择日期"
            style={popoverStyle}
          >
            <div className="date-popover-head">
              <button
                type="button"
                className="icon-btn"
                aria-label="上个月"
                onClick={() => setCursor((c) => addMonths(c, -1))}
              >
                ‹
              </button>
              <div className="date-popover-month">
                {format(cursor, 'yyyy年M月', { locale: zhCN })}
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="下个月"
                onClick={() => setCursor((c) => addMonths(c, 1))}
              >
                ›
              </button>
            </div>
            {viewMode === 'week' && (
              <p className="date-popover-hint">点选一天，跳转到包含该日的那一周</p>
            )}
            <div className="date-weekdays" aria-hidden="true">
              {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="date-grid">
              {weeks.map((week) => {
                const weekActive =
                  viewMode === 'week' &&
                  week.some((d) => selectedWeekKeys.has(toDateKey(d)))
                return (
                  <div
                    key={toDateKey(week[0])}
                    className={`date-week-row ${weekActive ? 'week-active' : ''}`}
                  >
                    {week.map((day) => {
                      const inMonth = isSameMonth(day, cursor)
                      const selected =
                        viewMode === 'day'
                          ? isSameDay(day, anchorDate)
                          : selectedWeekKeys.has(toDateKey(day))
                      const isToday = isSameDay(day, new Date())
                      return (
                        <button
                          key={toDateKey(day)}
                          type="button"
                          className={`date-cell ${inMonth ? '' : 'muted'} ${selected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                          onClick={() => pick(day)}
                        >
                          {format(day, 'd')}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
