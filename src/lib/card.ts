import { SUBJECTS } from '@/lib/options'

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1920
export const CARD_FONT = 'Futura Bold Oblique'
export const CARD_BACKGROUND = '#000000'
/** Shown in place of the location when there are no places. */
export const EMPTY_LOCATION = '???'

const PADDING_X = 90
const MAX_WIDTH = CARD_WIDTH - PADDING_X * 2
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
/** A location can wrap onto at most this many lines. */
const MAX_LOCATION_LINES = 3
/**
 * A location stays on one line if that only means shrinking it to this
 * fraction of the headline size; any smaller and it wraps instead.
 */
const MIN_ONE_LINE_RATIO = 0.6

export interface CardOptions {
  subject: string
  location: string
  color: string
}

export interface CardLine {
  text: string
  size: number
}

export function cardFont(size: number) {
  return `${size}px "${CARD_FONT}"`
}

/** Width of text including the oblique overhang on the right. */
function textWidth(ctx: CanvasRenderingContext2D, text: string) {
  const m = ctx.measureText(text)
  return Math.max(m.width, m.actualBoundingBoxRight)
}

/** Largest font size (up to maxSize) at which text fits on one line. */
function fitFontSize(ctx: CanvasRenderingContext2D, text: string, maxSize: number) {
  ctx.font = cardFont(maxSize)
  const width = textWidth(ctx, text)
  return width > MAX_WIDTH ? Math.floor((maxSize * MAX_WIDTH) / width) : maxSize
}

/**
 * Greedily wraps words into lines at the given size. Returns null if a
 * single word is too wide to fit on a line by itself.
 */
function wrapWords(ctx: CanvasRenderingContext2D, words: string[], size: number) {
  ctx.font = cardFont(size)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (textWidth(ctx, word) > MAX_WIDTH) return null
    const candidate = current ? `${current} ${word}` : word
    if (textWidth(ctx, candidate) <= MAX_WIDTH) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }
  lines.push(current)
  return lines
}

/**
 * Lays out the location as large as possible: on one line if it fits without
 * shrinking too much, otherwise wrapped onto up to MAX_LOCATION_LINES lines.
 */
function layoutLocation(
  ctx: CanvasRenderingContext2D,
  location: string,
  maxSize: number,
): CardLine[] {
  const words = location.split(/\s+/).filter(Boolean)
  const oneLine = words.join(' ')
  const oneLineSize = fitFontSize(ctx, oneLine, maxSize)
  if (words.length === 1 || oneLineSize >= maxSize * MIN_ONE_LINE_RATIO) {
    return [{ text: oneLine, size: oneLineSize }]
  }

  // Try sizes from largest down; the first that wraps into few enough lines wins.
  for (let size = maxSize; size > oneLineSize; size -= 2) {
    const lines = wrapWords(ctx, words, size)
    if (lines && lines.length <= MAX_LOCATION_LINES) {
      return lines.map((text) => ({ text, size }))
    }
  }
  return [{ text: oneLine, size: oneLineSize }]
}

/** Works out every line of text on the card and its font size. */
export function layoutCard(
  ctx: CanvasRenderingContext2D,
  options: Pick<CardOptions, 'subject' | 'location'>,
): CardLine[] {
  const headlineSize = Math.min(
    ...HEADLINE_LINES.map((text) => fitFontSize(ctx, text, MAX_FONT_SIZE)),
  )
  const location = options.location.trim().toUpperCase() || EMPTY_LOCATION

  return [
    { text: 'WOR$T', size: headlineSize },
    { text: `${options.subject.toUpperCase()} IN`, size: headlineSize },
    ...layoutLocation(ctx, location, headlineSize),
  ]
}

export function drawCard(ctx: CanvasRenderingContext2D, options: CardOptions) {
  ctx.fillStyle = CARD_BACKGROUND
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  const lines = layoutCard(ctx, options)

  // The gap above a line is sized from the line before it, so a small line
  // under a big one doesn't sit cramped against it. Lines of equal size end
  // up LINE_HEIGHT apart.
  const gapAfter = (line: CardLine) => line.size * (LINE_HEIGHT - CAP_HEIGHT)
  const baselines: number[] = []
  let y = 0
  lines.forEach((line, i) => {
    if (i > 0) y += gapAfter(lines[i - 1])
    y += line.size * CAP_HEIGHT
    baselines.push(y)
  })
  // Centre the block vertically: from the first cap top to the last baseline.
  const top = (CARD_HEIGHT - y) / 2

  ctx.fillStyle = options.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  lines.forEach((line, i) => {
    const baseline = top + baselines[i]
    ctx.font = cardFont(line.size)
    // Centre on the visible ink rather than the advance width, so the
    // oblique lean doesn't pull the text off-centre.
    const m = ctx.measureText(line.text)
    const x = (CARD_WIDTH - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft)) / 2
    ctx.fillText(line.text, x, baseline)
  })
}
