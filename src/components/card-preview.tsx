import { useEffect, useRef } from 'react'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  cardFont,
  drawCard,
  type CardOptions,
} from '@/lib/card'

export function CardPreview(props: CardOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { subject, location, color } = props

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    let cancelled = false
    const draw = () => {
      if (!cancelled) drawCard(ctx, { subject, location, color })
    }
    // Canvas text won't use the font until it has loaded, so wait for it.
    // If it fails to load, still draw (with the fallback font) and log why.
    document.fonts.load(cardFont(100)).then(draw, (error) => {
      console.error('Card font failed to load', error)
      draw()
    })
    return () => {
      cancelled = true
    }
  }, [subject, location, color])

  return (
    <canvas
      ref={canvasRef}
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      className="aspect-9/16 h-auto w-full max-w-[calc(70svh*9/16)] rounded-lg shadow-lg"
    />
  )
}
