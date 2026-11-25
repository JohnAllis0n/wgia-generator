import { useEffect, useState } from 'react'
import { cn } from 'cn'
import { CARD_WIDTH, cardFont, headlineFontSize } from '@/lib/card'

const HEADING = 'Wor$t Girl Generator'
/** The card's red. */
const HEADING_COLOR = '#e91516'

interface Sizing {
  /** Headline font size as a fraction of the card's width. */
  perCardWidth: number
  /** Width of the heading's widest word, in ems (plus room for the slant). */
  widestWordEms: number
}

/**
 * "WORST GIRL GENERATOR" in the card's font and red, at the same size as
 * "WOR$T" on the card as it's shown on screen. If the widest word wouldn't
 * fit at that size (e.g. on a narrow phone), it shrinks just enough to fit.
 */
export function PageHeading({ className }: { className?: string }) {
  const [sizing, setSizing] = useState<Sizing | null>(null)

  useEffect(() => {
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      const ctx = document.createElement('canvas').getContext('2d')
      if (!ctx) return
      ctx.font = cardFont(100)
      const widest = Math.max(
        ...HEADING.toUpperCase().split(' ').map((word) => {
          const m = ctx.measureText(word)
          return Math.max(m.width, m.actualBoundingBoxRight)
        }),
      )
      setSizing({
        perCardWidth: headlineFontSize(ctx) / CARD_WIDTH,
        widestWordEms: (widest / 100) * 1.04,
      })
    }
    document.fonts.load(cardFont(100)).then(measure, measure)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    // A size container, so the heading can fit itself to its own width (cqw).
    <div className={cn('@container w-full', className)}>
      <h1
        aria-label="Worst Girl Generator"
        className="text-center leading-[0.95] uppercase transition-opacity duration-300"
        style={{
          fontFamily: '"Futura Bold Oblique", sans-serif',
          color: HEADING_COLOR,
          opacity: sizing ? 1 : 0,
          // --card-width is the card's width on screen, set by CardPreview.
          fontSize: sizing
            ? `min(calc(var(--card-width, 320px) * ${sizing.perCardWidth}), calc(100cqw / ${sizing.widestWordEms}))`
            : undefined,
        }}
      >
        {HEADING}
      </h1>
    </div>
  )
}
