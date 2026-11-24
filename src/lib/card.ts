import { SUBJECTS } from '@/lib/options'

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1920
export const CARD_FONT = 'Futura Bold Oblique'
export const CARD_BACKGROUND = '#000000'

const PADDING_X = 90
const MAX_FONT_SIZE = 230
/** Distance between baselines, as a multiple of font size. */
const LINE_HEIGHT = 0.95
/** Approximate cap height of Futura, as a multiple of font size. */
const CAP_HEIGHT = 0.72
/**
 * Every headline line, for every subject. The headline is sized so the widest
 * of these fits, so switching subject never changes the text size.
 */
const HEADLINE_LINES = ['WOR$T', ...SUBJECTS.map((s) => `${s.toUpperCase()} IN`)]

export interface CardOptions {
  subject: string
  location: string
  color: string
}

export function cardFont(size: number) {
  return `${size}px "${CARD_FONT}"`
}

/** Width of text including the oblique overhang on the right. */
function textWidth(ctx: CanvasRenderingContext2D, text: string) {
  const m = ctx.measureText(text)
  return Math.max(m.width, m.actualBoundingBoxRight)
}

/** Largest font size (up to maxSize) at which text fits in maxWidth. */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
) {
  ctx.font = cardFont(maxSize)
  const width = textWidth(ctx, text)
  return width > maxWidth ? Math.floor((maxSize * maxWidth) / width) : maxSize
}

export function drawCard(ctx: CanvasRenderingContext2D, options: CardOptions) {
  const maxWidth = CARD_WIDTH - PADDING_X * 2

  ctx.fillStyle = CARD_BACKGROUND
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const headlineSize = Math.min(
    ...HEADLINE_LINES.map((text) => fitFontSize(ctx, text, maxWidth, MAX_FONT_SIZE)),
  )
  const location = options.location.toUpperCase()
  const locationSize = fitFontSize(ctx, location, maxWidth, headlineSize)

  const lines = [
    { text: 'WOR$T', size: headlineSize },
    { text: `${options.subject.toUpperCase()} IN`, size: headlineSize },
    { text: location, size: locationSize },
  ]

  // Centre the block vertically: from the first cap top to the last baseline.
  const blockHeight =
    lines[0].size * CAP_HEIGHT +
    lines.slice(1).reduce((sum, line) => sum + line.size * LINE_HEIGHT, 0)
  let baseline = (CARD_HEIGHT - blockHeight) / 2 + lines[0].size * CAP_HEIGHT

  ctx.fillStyle = options.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  lines.forEach((line, i) => {
    if (i > 0) baseline += line.size * LINE_HEIGHT
    ctx.font = cardFont(line.size)
    // Centre on the visible ink rather than the advance width, so the
    // oblique lean doesn't pull the text off-centre.
    const m = ctx.measureText(line.text)
    const x = (CARD_WIDTH - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft)) / 2
    ctx.fillText(line.text, x, baseline)
  })
}
