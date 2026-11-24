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
  /** True for the lines that make up the location (the typed part). */
  isLocation?: boolean
}

/** Which part of the location to show, for the typing animation. */
export interface CardTyping {
  /** Number of location characters to draw (spaces between lines count). */
  visible: number
  /** Whether to draw the caret after the last visible character. */
  caret: boolean
}

/** Caret size as fractions of the font size, and its lean to match the font. */
const CARET_WIDTH = 0.09
const CARET_GAP = 0.05
/**
 * How far the caret reaches above the capitals and below the baseline. The
 * top is also clamped to stay clear of the line above (see drawCaret).
 */
const CARET_ABOVE_CAPS = 0.2
const CARET_BELOW_BASELINE = 0.05
/** Minimum space between the caret's top and the line above's baseline. */
const CARET_CLEARANCE = 0.03
const CARET_SLANT = Math.tan((12 * Math.PI) / 180)

export function cardFont(size: number) {
  return `${size}px "${CARD_FONT}"`
}

/**
 * The location exactly as the card shows it: single-spaced, upper case, and
 * with every S swapped for $ to match "WOR$T".
 */
export function locationText(location: string) {
  return location
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
    .toUpperCase()
    .replaceAll('S', '$')
}

/** Number of characters in the location as the card shows it. */
export function locationLength(location: string) {
  return Array.from(locationText(location)).length
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

/**
 * Layouts already worked out, keyed by subject and location. Fitting and
 * wrapping a location takes many text measurements, and the preview redraws
 * several times a second while typing, so each layout is computed once.
 */
const layoutCache = new Map<string, CardLine[]>()
const LAYOUT_CACHE_LIMIT = 200

/** Works out every line of text on the card and its font size. */
export function layoutCard(
  ctx: CanvasRenderingContext2D,
  options: Pick<CardOptions, 'subject' | 'location'>,
): CardLine[] {
  // Measurements change once the font loads, so only cache real ones.
  const fontLoaded = document.fonts.check(cardFont(100))
  const key = `${options.subject}\n${options.location}`
  const cached = fontLoaded ? layoutCache.get(key) : undefined
  if (cached) return cached

  const lines = computeLayout(ctx, options)
  if (fontLoaded) {
    if (layoutCache.size >= LAYOUT_CACHE_LIMIT) layoutCache.clear()
    layoutCache.set(key, lines)
  }
  return lines
}

/** Font size of "WOR$T" / "GIRL IN" on the full-size (1080 px wide) card. */
export function headlineFontSize(ctx: CanvasRenderingContext2D) {
  return Math.min(...HEADLINE_LINES.map((text) => fitFontSize(ctx, text, MAX_FONT_SIZE)))
}

function computeLayout(
  ctx: CanvasRenderingContext2D,
  options: Pick<CardOptions, 'subject' | 'location'>,
): CardLine[] {
  const headlineSize = headlineFontSize(ctx)
  const location = locationText(options.location) || EMPTY_LOCATION

  return [
    { text: 'WOR$T', size: headlineSize },
    { text: `${options.subject.toUpperCase()} IN`, size: headlineSize },
    ...layoutLocation(ctx, location, headlineSize).map((line) => ({
      ...line,
      isLocation: true,
    })),
  ]
}

/**
 * Baseline of each line, measured from the first line's cap top. The gap
 * above a line is sized from the line before it, so a small line under a
 * big one doesn't sit cramped against it. Lines of equal size end up
 * LINE_HEIGHT apart.
 */
function stackBaselines(lines: CardLine[]) {
  const baselines: number[] = []
  let y = 0
  lines.forEach((line, i) => {
    if (i > 0) y += lines[i - 1].size * (LINE_HEIGHT - CAP_HEIGHT)
    y += line.size * CAP_HEIGHT
    baselines.push(y)
  })
  return baselines
}

/**
 * Cuts the location lines down to the first `visible` characters, and says
 * which line the caret belongs on. Lines are joined by single spaces, so the
 * space at each wrap counts as one character.
 */
function typedLines(lines: CardLine[], visible: number) {
  let start = 0
  let caretLine = -1
  const texts = lines.map((line, i) => {
    if (!line.isLocation) return line.text
    const chars = Array.from(line.text)
    if (caretLine === -1 || start <= visible) caretLine = i
    const shown = chars.slice(0, Math.max(0, visible - start)).join('')
    start += chars.length + 1
    return shown
  })
  return { texts, caretLine }
}

/**
 * Draws a caret leaning to match the oblique font. It crosses the baseline
 * at x and reaches beyond the capitals above and below, like a text cursor.
 * It never reaches above `limitTop`, so it can't touch the line above.
 * Expects ctx.font to already be set to the line's font.
 */
function drawCaret(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  size: number,
  limitTop: number,
) {
  const width = size * CARET_WIDTH
  const capHeight = ctx.measureText('H').actualBoundingBoxAscent
  const top = Math.max(baseline - capHeight - size * CARET_ABOVE_CAPS, limitTop)
  const bottom = baseline + size * CARET_BELOW_BASELINE
  // Horizontal position of the caret's left edge at height y.
  const leftAt = (y: number) => x + (baseline - y) * CARET_SLANT
  ctx.beginPath()
  ctx.moveTo(leftAt(bottom), bottom)
  ctx.lineTo(leftAt(bottom) + width, bottom)
  ctx.lineTo(leftAt(top) + width, top)
  ctx.lineTo(leftAt(top), top)
  ctx.closePath()
  ctx.fill()
}

/**
 * What goes behind the text: an image (scaled to cover the card), plain
 * black (undefined), or nothing at all ('transparent'), for when the live
 * preview shows the background as a separate element underneath.
 */
export type CardBackground = HTMLImageElement | 'transparent' | undefined

/** Draws an image scaled to cover the whole card, cropping the overflow evenly. */
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  const scale = Math.max(
    CARD_WIDTH / image.naturalWidth,
    CARD_HEIGHT / image.naturalHeight,
  )
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  ctx.drawImage(image, (CARD_WIDTH - width) / 2, (CARD_HEIGHT - height) / 2, width, height)
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  options: CardOptions,
  typing?: CardTyping,
  background?: CardBackground,
) {
  if (background === 'transparent') {
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  } else {
    ctx.fillStyle = CARD_BACKGROUND
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
    if (background) drawCover(ctx, background)
  }

  // Lay out using the full location, so nothing shifts while it's typed.
  const lines = layoutCard(ctx, options)
  const { texts, caretLine } = typing
    ? typedLines(lines, typing.visible)
    : { texts: lines.map((line) => line.text), caretLine: -1 }

  const baselines = stackBaselines(lines)
  // Keep the headline in the same place for every location: position the
  // block as if the location were one line at headline size, centred. Longer
  // (wrapped) locations then extend downwards and shorter ones sit a little
  // higher, but "WOR$T / GIRL IN" never moves between places.
  const headline = lines.filter((line) => !line.isLocation)
  const reference = [...headline, { text: '', size: headline[0].size }]
  const top = (CARD_HEIGHT - stackBaselines(reference).at(-1)!) / 2

  ctx.fillStyle = options.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  lines.forEach((line, i) => {
    const baseline = top + baselines[i]
    const text = texts[i]
    ctx.font = cardFont(line.size)
    // Centre on the visible ink rather than the advance width, so the
    // oblique lean doesn't pull the text off-centre.
    const m = ctx.measureText(text)
    const x = text
      ? (CARD_WIDTH - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft)) / 2
      : CARD_WIDTH / 2
    if (text) ctx.fillText(text, x, baseline)

    if (typing?.caret && i === caretLine) {
      const caretX = text ? x + m.width + line.size * CARET_GAP : x
      const limitTop =
        i > 0 ? top + baselines[i - 1] + line.size * CARET_CLEARANCE : -Infinity
      drawCaret(ctx, caretX, baseline, line.size, limitTop)
    }
  })
}
