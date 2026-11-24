import { useEffect, useRef, useState } from 'react'
import { cn } from 'cn'
import { Skeleton } from '@/components/ui/skeleton'
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
  const cardRef = useRef<HTMLDivElement>(null)
  // Which background URL has finished loading (shows the skeleton until then).
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)
  const backgroundLoaded = loadedUrl === background

  // Publish the card's on-screen width as --card-width, so other elements
  // (the page heading) can match the card's text size.
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const root = document.documentElement
    const observer = new ResizeObserver(([entry]) => {
      root.style.setProperty('--card-width', `${entry.contentRect.width}px`)
    })
    observer.observe(card)
    return () => observer.disconnect()
  }, [])
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
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // With a background image, the <img> below shows it (animated GIFs play
    // natively there), so the canvas only draws the text on a clear layer.
    const layer = background ? 'transparent' : undefined

    const lengths = places.map(locationLength)
    let frameId = 0
    let lastKey = ''
    let lastIndex = -1
    let cancelled = false
    let fontReady = false
    let onScreen = true
    let running = false

    const tick = (now: number) => {
      if (places.length === 0) {
        drawCard(ctx, { subject, color, location: '' }, undefined, layer)
        running = false
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
      // Keep going while there's more to animate and the card is visible.
      running = !frame.done && onScreen
      if (running) frameId = requestAnimationFrame(tick)
    }

    const resume = () => {
      if (cancelled || !fontReady || running) return
      running = true
      frameId = requestAnimationFrame(tick)
    }

    // Pause while the card is scrolled out of view; pick up where the
    // animation's clock says it should be when it comes back.
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen) resume()
    })
    observer.observe(canvas)

    // Canvas text won't use the font until it has loaded, so wait for it.
    // If it fails to load, still animate (with the fallback font) and log why.
    const onFont = () => {
      fontReady = true
      resume()
    }
    document.fonts.load(cardFont(100)).then(onFont, (error) => {
      console.error('Card font failed to load', error)
      onFont()
    })

    return () => {
      cancelled = true
      observer.disconnect()
      cancelAnimationFrame(frameId)
    }
  }, [subject, color, places, background])

  return (
    <div
      ref={cardRef}
      className="relative aspect-9/16 w-full max-w-[calc(70svh*9/16)] md:max-w-[calc(85svh*9/16)] overflow-hidden rounded-lg bg-black shadow-lg"
    >
      {background && !backgroundLoaded && (
        // Placeholder while the background downloads, instead of it popping in.
        <Skeleton className="absolute inset-0 rounded-none" />
      )}
      {background && (
        <img
          key={background}
          ref={(img) => {
            // Already cached: onLoad may have fired before React attached it.
            if (img?.complete && img.naturalWidth > 0) setLoadedUrl(background)
          }}
          src={background}
          alt=""
          // The background is the main thing on screen: fetch it first.
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoadedUrl(background)}
          onError={() => setLoadedUrl(background)}
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-300',
            backgroundLoaded ? 'opacity-100' : 'opacity-0',
          )}
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
