import { useRef, useState } from 'react'
import type { EventOccurrence } from '../types'
import {
  HOUR_END,
  HOUR_START,
  clamp,
  dateFromDayAndMinutes,
  formatTime,
  snapMinutes,
  startOfDay,
} from '../utils/date'

interface Props {
  occurrence: EventOccurrence
  day: Date
  pxPerMinute: number
  className?: string
  styleExtra?: React.CSSProperties
  /** 周视图跨天：根据指针 X 解析目标日 */
  resolveDayFromX?: (clientX: number) => Date | null
  onCommit: (next: { start: Date; end: Date; day: Date }) => void
  onOpen: () => void
}

export function DraggableEvent({
  occurrence,
  day,
  pxPerMinute,
  className = '',
  styleExtra,
  resolveDayFromX,
  onCommit,
  onOpen,
}: Props) {
  const [live, setLive] = useState<{ start: Date; end: Date; day: Date } | null>(
    null,
  )
  const modeRef = useRef<'move' | 'resize' | null>(null)
  const originY = useRef(0)
  const baseStartMin = useRef(0)
  const baseEndMin = useRef(0)
  const baseDay = useRef(day)
  const moved = useRef(false)
  const liveRef = useRef(live)
  liveRef.current = live

  const displayStart = live?.start ?? occurrence.start
  const displayEnd = live?.end ?? occurrence.end
  const startMin = Math.max(
    displayStart.getHours() * 60 + displayStart.getMinutes(),
    HOUR_START * 60,
  )
  const endMin = Math.min(
    displayEnd.getHours() * 60 + displayEnd.getMinutes(),
    HOUR_END * 60,
  )
  const top = (startMin - HOUR_START * 60) * pxPerMinute
  const height = Math.max((endMin - startMin) * pxPerMinute, 28)

  function begin(e: React.PointerEvent, mode: 'move' | 'resize') {
    e.preventDefault()
    e.stopPropagation()
    modeRef.current = mode
    originY.current = e.clientY
    baseStartMin.current =
      occurrence.start.getHours() * 60 + occurrence.start.getMinutes()
    baseEndMin.current =
      occurrence.end.getHours() * 60 + occurrence.end.getMinutes()
    baseDay.current = day
    moved.current = false
    setLive({ start: occurrence.start, end: occurrence.end, day })

    const onMove = (ev: PointerEvent) => {
      if (!modeRef.current) return
      const delta = snapMinutes((ev.clientY - originY.current) / pxPerMinute)
      if (Math.abs(ev.clientY - originY.current) > 5) moved.current = true
      const minBound = HOUR_START * 60
      const maxBound = HOUR_END * 60
      const duration = baseEndMin.current - baseStartMin.current

      let targetDay = baseDay.current
      if (modeRef.current === 'move' && resolveDayFromX) {
        const resolved = resolveDayFromX(ev.clientX)
        if (resolved) {
          targetDay = startOfDay(resolved)
          if (targetDay.getTime() !== baseDay.current.getTime()) moved.current = true
        }
      }

      if (modeRef.current === 'move') {
        let nextStart = snapMinutes(baseStartMin.current + delta)
        nextStart = clamp(nextStart, minBound, maxBound - Math.max(duration, 15))
        setLive({
          day: targetDay,
          start: dateFromDayAndMinutes(targetDay, nextStart),
          end: dateFromDayAndMinutes(targetDay, nextStart + duration),
        })
      } else {
        let nextEnd = snapMinutes(baseEndMin.current + delta)
        nextEnd = clamp(nextEnd, baseStartMin.current + 15, maxBound)
        setLive({
          day: baseDay.current,
          start: dateFromDayAndMinutes(baseDay.current, baseStartMin.current),
          end: dateFromDayAndMinutes(baseDay.current, nextEnd),
        })
      }
    }

    const onUp = () => {
      const wasMoved = moved.current
      const snapshot = liveRef.current
      modeRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (!wasMoved) {
        setLive(null)
        onOpen()
        return
      }
      if (snapshot) onCommit(snapshot)
      setLive(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const { event } = occurrence
  const repeating = event.recurrence.freq !== 'none'
  const ghostAway =
    live && live.day.getTime() !== day.getTime() ? 'ghost-away' : ''

  return (
    <div
      className={`event-block color-${event.color} ${event.completed ? 'done' : ''} ${live ? 'dragging' : ''} ${ghostAway} ${className}`}
      style={{ top, height, ...styleExtra }}
      onPointerDown={(e) => begin(e, 'move')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen()
      }}
    >
      <span className="t">{event.title}</span>
      <span className="m">
        {formatTime(displayStart)} – {formatTime(displayEnd)}
        {repeating ? ' · 重复' : ''}
      </span>
      <span
        className="resize-handle"
        onPointerDown={(e) => begin(e, 'resize')}
        title="拖动调整时长"
      />
    </div>
  )
}
