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
  /** Called with the index of the place on screen whenever it changes. */
  onPlaceChange?: (index: number) => void
  /** URL of the background image, or undefined for plain black. */
  background?: string
}

export function CardPreview({
  subject,
  color,
  places,
  onPlaceChange,
  background,
}: CardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // When the current cycle started. Reset only when the places change, so
  // switching subject or colour doesn't restart the animation.
  const startRef = useRef(0)
  // Kept in a ref so a new callback each render doesn't restart the animation.
  const onPlaceChangeRef = useRef(onPlaceChange)
  useEffect(() => {
    onPlaceChangeRef.current = onPlaceChange
  })

  useEffect(() => {
    startRef.current = performance.now()
  }, [places])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    // With a background image, the <img> below shows it (animated GIFs play
    // natively there), so the canvas only draws the text on a clear layer.
    const layer = background ? 'transparent' : undefined

    const lengths = places.map(locationLength)
    let frameId = 0
    let lastKey = ''
    let lastIndex = -1
    let cancelled = false

    const tick = (now: number) => {
      if (places.length === 0) {
        drawCard(ctx, { subject, color, location: '' }, undefined, layer)
        return // Nothing to animate.
      }
      const frame = typingFrameAt(lengths, now - startRef.current)
      // Only redraw when something visible has changed.
      const key = `${frame.index}|${frame.visible}|${frame.caret}`
      if (key !== lastKey) {
        lastKey = key
        drawCard(ctx, { subject, color, location: places[frame.index] }, frame, layer)
        if (frame.index !== lastIndex) {
          lastIndex = frame.index
          onPlaceChangeRef.current?.(frame.index)
        }
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
  }, [subject, color, places, background])

  return (
    <div className="relative aspect-9/16 w-full max-w-[calc(70svh*9/16)] md:max-w-[calc(85svh*9/16)] overflow-hidden rounded-lg bg-black shadow-lg">
      {background && (
        <img
          key={background}
          src={background}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <canvas
        ref={canvasRef}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        className="absolute inset-0 size-full"
      />
    </div>
  )
}
