import { openBackground } from '@/lib/background-frames'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  cardFont,
  drawCard,
  locationLength,
  type CardOptions,
} from '@/lib/card'
import { loadImage } from '@/lib/load-image'
import { typingDuration, typingFrameAt } from '@/lib/typing'

/** Frames per second of the downloaded video. */
const VIDEO_FPS = 30
/** H.264: the codec phones and social apps all accept. */
const VIDEO_CODEC = 'avc'
/**
 * Fixed quality rather than a target bitrate: with a bitrate target the
 * encoder smears the grain in moving backgrounds. Lower is better quality
 * (H.264 range 0–51). 18 is visually lossless; 22 looked the same in tests
 * at about two-thirds the size.
 */
const VIDEO_QUANTIZER = 22
/** Used instead where the encoder can't do fixed quality, in bits per second. */
const FALLBACK_BITRATE = 20_000_000
/** The video library is large, so it only loads when it's first needed. */
async function videoLibrary() {
  const lib = await import('mediabunny')
  const quality = new lib.Quality({ quantizer: VIDEO_QUANTIZER, bitrate: FALLBACK_BITRATE })
  return { ...lib, quality }
}

function createCardCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
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
 * animated background, this uses its first frame.
 */
export async function renderCardPng(
  options: CardOptions,
  backgroundUrl?: string,
): Promise<Blob> {
  const [, background] = await Promise.all([
    fontReady(),
    // Not kept afterwards: big animated backgrounds use a lot of memory decoded.
    backgroundUrl ? loadImage(backgroundUrl, { keep: false }) : undefined,
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

/** Whether this browser can make the MP4 (it needs an H.264 encoder). */
export async function canRenderVideo() {
  const { canEncodeVideo, quality } = await videoLibrary()
  return canEncodeVideo(VIDEO_CODEC, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    quality,
    frameRate: VIDEO_FPS,
  }).catch(() => false)
}

export interface VideoOptions {
  subject: string
  color: string
  places: string[]
  /** URL of the background image, or undefined for plain black. */
  background?: string
}

/**
 * One full run of the typing animation as a 1080×1920 MP4, with the
 * background moving behind it if it's animated. With several places it's
 * one loop through them all; with one place it types it out, then holds.
 * `onProgress` gets a value from 0 to 1.
 */
export async function renderCardVideo(
  { subject, color, places, background: backgroundUrl }: VideoOptions,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const [, player] = await Promise.all([
    fontReady(),
    backgroundUrl ? openBackground(backgroundUrl) : undefined,
  ])
  try {
    const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, quality } =
      await videoLibrary()
    const { canvas, ctx } = createCardCanvas()
    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new BufferTarget(),
    })
    const source = new CanvasSource(canvas, { codec: VIDEO_CODEC, quality })
    output.addVideoTrack(source, { frameRate: VIDEO_FPS })
    await output.start()

    const lengths = places.map(locationLength)
    const totalMs = places.length ? typingDuration(lengths) : 1000
    const frameCount = Math.ceil((totalMs / 1000) * VIDEO_FPS)
    // When the background's current frame stops showing.
    let backgroundEnd = player?.durationMs ?? Infinity

    for (let i = 0; i < frameCount; i++) {
      const time = (i * 1000) / VIDEO_FPS
      while (player && time >= backgroundEnd) {
        await player.next()
        backgroundEnd += player.durationMs
      }
      const typing = places.length ? typingFrameAt(lengths, time) : undefined
      const location = typing ? places[typing.index] : ''
      drawCard(ctx, { subject, color, location }, typing, player?.image)
      // Waits when the encoder is busy, which also keeps the page responsive.
      await source.add(i / VIDEO_FPS, 1 / VIDEO_FPS)
      onProgress?.((i + 1) / frameCount)
    }

    source.close()
    await output.finalize()
    const buffer = output.target.buffer
    if (!buffer) throw new Error('Video export failed')
    return new Blob([buffer], { type: 'video/mp4' })
  } finally {
    player?.close()
  }
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
