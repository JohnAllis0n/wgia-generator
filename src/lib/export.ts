import { GIFEncoder } from 'gifenc'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  cardFont,
  drawCard,
  locationLength,
  type CardOptions,
} from '@/lib/card'
import { loadImage } from '@/lib/load-image'
import { typingTimeline } from '@/lib/typing'

/** Shades between black and the text colour in the GIF palette. */
const GIF_SHADES = 16

function createCardCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D is not available')
  return { canvas, ctx }
}

/** Make sure the card font is ready before drawing anything to export. */
async function fontReady() {
  try {
    await document.fonts.load(cardFont(100))
  } catch (error) {
    console.error('Card font failed to load', error)
  }
}

function slug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** File name such as "worst-girl-in-the-avenues". */
export function exportFileName(subject: string, place: string) {
  return slug(`worst ${subject} in ${place || 'nowhere'}`)
}

/**
 * The card for one place, fully typed with no caret, as a PNG. With an
 * animated GIF background, this uses its first frame.
 */
export async function renderCardPng(
  options: CardOptions,
  backgroundUrl?: string,
): Promise<Blob> {
  const [, background] = await Promise.all([
    fontReady(),
    backgroundUrl ? loadImage(backgroundUrl) : undefined,
  ])
  const { canvas, ctx } = createCardCanvas()
  drawCard(ctx, options, undefined, background)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))),
      'image/png',
    ),
  )
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * The card is only ever black, the text colour, and the anti-aliased shades
 * between them, so a palette of evenly spaced blends is exact and lets each
 * pixel be mapped without a full colour search.
 */
function blendPalette(color: number[]) {
  return Array.from({ length: GIF_SHADES }, (_, i) =>
    color.map((c) => Math.round((c * i) / (GIF_SHADES - 1))),
  )
}

/** Maps canvas pixels to palette indexes via the colour's strongest channel. */
function toIndexes(pixels: Uint8ClampedArray, color: number[], out: Uint8Array) {
  const channel = color.indexOf(Math.max(...color))
  const full = color[channel]
  const scale = (GIF_SHADES - 1) / full
  for (let p = 0, i = channel; p < out.length; p++, i += 4) {
    const shade = Math.round(pixels[i] * scale)
    out[p] = shade > GIF_SHADES - 1 ? GIF_SHADES - 1 : shade
  }
}

const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * One full run of the typing animation as a GIF. Several places loop
 * forever; a single place types once and stays on the finished card.
 * `onProgress` gets a value from 0 to 1.
 */
export async function renderCardGif(
  options: { subject: string; color: string; places: string[] },
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  await fontReady()
  const { subject, color, places } = options
  const { ctx } = createCardCanvas()
  const rgb = hexToRgb(color)
  const palette = blendPalette(rgb)
  const indexes = new Uint8Array(CARD_WIDTH * CARD_HEIGHT)
  const gif = GIFEncoder()

  const steps = places.length
    ? typingTimeline(places.map(locationLength))
    : [{ frame: undefined, durationMs: 1000 }]
  const loops = places.length > 1

  // GIF delays are in 1/100 s; round the running total, not each frame,
  // so rounding errors don't add up over a long loop.
  let elapsed = 0
  let written = 0

  for (let i = 0; i < steps.length; i++) {
    const { frame, durationMs } = steps[i]
    drawCard(ctx, { subject, color, location: frame ? places[frame.index] : '' }, frame)
    toIndexes(ctx.getImageData(0, 0, CARD_WIDTH, CARD_HEIGHT).data, rgb, indexes)

    elapsed += durationMs
    const end = Math.round(elapsed / 10) * 10
    gif.writeFrame(indexes, CARD_WIDTH, CARD_HEIGHT, {
      palette: i === 0 ? palette : undefined,
      delay: end - written,
      repeat: loops ? 0 : -1,
      colorDepth: 4,
    })
    written = end

    onProgress?.((i + 1) / steps.length)
    // Yield so the page stays responsive and can show progress.
    if (i % 4 === 3) await nextFrame()
  }

  gif.finish()
  return new Blob([gif.bytes()], { type: 'image/gif' })
}

/** Saves a blob as a file download. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
