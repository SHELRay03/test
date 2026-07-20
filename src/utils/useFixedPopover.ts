import { useCallback, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

export type PopoverAlign = 'start' | 'end'

export function useFixedPopover(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  align: PopoverAlign = 'start',
  width = 292,
) {
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 80,
  })

  const update = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 8
    const panelWidth = Math.min(width, window.innerWidth - 16)
    let left = align === 'end' ? rect.right - panelWidth : rect.left
    left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8))
    let top = rect.bottom + gap
    const approxHeight = 360
    if (top + Math.min(approxHeight, window.innerHeight * 0.5) > window.innerHeight - 8) {
      top = Math.max(8, rect.top - gap - 280)
    }
    setStyle({
      position: 'fixed',
      top,
      left,
      width: panelWidth,
      zIndex: 80,
    })
  }, [anchorRef, align, width])

  useLayoutEffect(() => {
    if (!open) return
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, update])

  return style
}
