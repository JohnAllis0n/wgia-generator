import { useEffect } from 'react'
import { BACKGROUNDS } from '@/lib/backgrounds'

interface NetworkInformation {
  saveData?: boolean
  effectiveType?: string
}

/** Skip prefetching when the user has data saver on or a slow connection. */
function shouldSaveData() {
  const connection = (navigator as Navigator & { connection?: NetworkInformation })
    .connection
  if (!connection) return false
  return Boolean(connection.saveData) || /(^|-)2g$|^3g$/.test(connection.effectiveType ?? '')
}

/**
 * Once the current background has loaded, quietly loads the previous and
 * next ones so switching to them is instant. Only those two are held; moving
 * on releases them.
 */
export function usePrefetchBackgrounds(index: number) {
  useEffect(() => {
    const count = BACKGROUNDS.length
    if (count < 2 || shouldSaveData()) return

    let cancelled = false
    const held: HTMLImageElement[] = []

    const prefetchNeighbours = () => {
      if (cancelled) return
      const neighbours = new Set([(index + 1) % count, (index - 1 + count) % count])
      for (const i of neighbours) {
        const img = new Image()
        img.decoding = 'async'
        img.fetchPriority = 'low'
        img.src = BACKGROUNDS[i]
        held.push(img)
      }
    }

    // Wait for the current background first, so it never competes with these.
    const current = new Image()
    current.src = BACKGROUNDS[index]
    current.decode().then(prefetchNeighbours, prefetchNeighbours)

    return () => {
      cancelled = true
      held.length = 0
    }
  }, [index])
}
