import type { EventOccurrence, LaidOutOccurrence } from '../types'

/** 重叠事件分栏布局 */
export function layoutOverlaps(items: EventOccurrence[]): LaidOutOccurrence[] {
  if (items.length === 0) return []
  const sorted = [...items].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime(),
  )

  type Active = { end: number; col: number }
  const result: LaidOutOccurrence[] = []
  let cluster: EventOccurrence[] = []
  let clusterEnd = -1
  const flush = () => {
    if (cluster.length === 0) return
    const actives: Active[] = []
    const placed: { occ: EventOccurrence; col: number }[] = []
    let maxCol = 0
    for (const occ of cluster) {
      const t = occ.start.getTime()
      for (let i = actives.length - 1; i >= 0; i--) {
        if (actives[i].end <= t) actives.splice(i, 1)
      }
      const used = new Set(actives.map((a) => a.col))
      let col = 0
      while (used.has(col)) col++
      maxCol = Math.max(maxCol, col)
      actives.push({ end: occ.end.getTime(), col })
      placed.push({ occ, col })
    }
    const colCount = maxCol + 1
    for (const p of placed) {
      result.push({ ...p.occ, col: p.col, colCount })
    }
    cluster = []
    clusterEnd = -1
  }

  for (const occ of sorted) {
    if (cluster.length === 0) {
      cluster = [occ]
      clusterEnd = occ.end.getTime()
      continue
    }
    if (occ.start.getTime() < clusterEnd) {
      cluster.push(occ)
      clusterEnd = Math.max(clusterEnd, occ.end.getTime())
    } else {
      flush()
      cluster = [occ]
      clusterEnd = occ.end.getTime()
    }
  }
  flush()
  return result
}
