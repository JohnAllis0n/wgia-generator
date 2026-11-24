import { useEffect, useRef } from 'react'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  cardFont,
  drawCard,
  locationLength,
} from '@/lib/card'
import { typingFrameAt } from '@/lib/typing'

interface CardPreviewProps {
  subject: string
  color: string
  /** Places to cycle through. With none, the card shows a placeholder. */
  places: string[]
}

export function CardPreview({ subject, color, places }: CardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // When the current cycle started. Reset only when the places change, so
  // switching subject or colour doesn't restart the animation.
  const startRef = useRef(0)

  useEffect(() => {
    startRef.current = performance.now()
  }, [places])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const lengths = places.map(locationLength)
    let frameId = 0
    let lastKey = ''
    let cancelled = false

    const tick = (now: number) => {
      if (places.length === 0) {
        drawCard(ctx, { subject, color, location: '' })
        return // Nothing to animate.
      }
      const frame = typingFrameAt(lengths, now - startRef.current)
      // Only redraw when something visible has changed.
      const key = `${frame.index}|${frame.visible}|${frame.caret}`
      if (key !== lastKey) {
        lastKey = key
        drawCard(ctx, { subject, color, location: places[frame.index] }, frame)
      }
      if (!frame.done) frameId = requestAnimationFrame(tick)
    }

    // Canvas text won't use the font until it has loaded, so wait for it.
    // If it fails to load, still animate (with the fallback font) and log why.
    const start = () => {
      if (!cancelled) frameId = requestAnimationFrame(tick)
    }
    document.fonts.load(cardFont(100)).then(start, (error) => {
      console.error('Card font failed to load', error)
      start()
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
    }
  }, [subject, color, places])

  return (
    <canvas
      ref={canvasRef}
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      className="aspect-9/16 h-auto w-full max-w-[calc(70svh*9/16)] rounded-lg shadow-lg"
    />
  )
}
