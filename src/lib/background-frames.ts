import { loadImage } from '@/lib/load-image'

/** Something the card can draw as its background. */
export type BackgroundImage = HTMLImageElement | VideoFrame | ImageBitmap

/**
 * Plays a background image frame by frame, for exporting. Animated GIF,
 * WebP and AVIF files give every frame (where the browser can decode them
 * one at a time); anything else is a single frame that lasts forever.
 */
export interface BackgroundPlayer {
  /** The frame showing at the start. */
  readonly image: BackgroundImage
  /** How long `image` stays on screen, in ms (Infinity for a still image). */
  readonly durationMs: number
  /** True if there's more than one frame. */
  readonly animated: boolean
  /** Moves on to the next frame, looping back to the first after the last. */
  next(): Promise<void>
  /** Frees the decoder and any frame still held. */
  close(): void
}

const MIME_TYPES: Record<string, string> = {
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  png: 'image/png',
  apng: 'image/apng',
}

/** GIFs with no delay (or a tiny one) play at 10 fps in browsers. */
const MIN_FRAME_MS = 20
const DEFAULT_FRAME_MS = 100

function stillPlayer(image: HTMLImageElement): BackgroundPlayer {
  return {
    image,
    durationMs: Infinity,
    animated: false,
    next: async () => {},
    close: () => {},
  }
}

export async function openBackground(url: string): Promise<BackgroundPlayer> {
  const extension = url.split('.').pop()?.toLowerCase() ?? ''
  const type = MIME_TYPES[extension]
  const canDecode =
    type !== undefined &&
    typeof ImageDecoder !== 'undefined' &&
    (await ImageDecoder.isTypeSupported(type))

  if (!canDecode) {
    // Browsers without ImageDecoder (or other formats): use it as a still.
    return stillPlayer(await loadImage(url, { keep: false }))
  }

  const response = await fetch(url)
  if (!response.ok || !response.body) throw new Error(`Failed to load ${url}`)
  const decoder = new ImageDecoder({ data: response.body, type })
  await decoder.tracks.ready
  await decoder.completed
  const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 1

  if (frameCount <= 1) {
    decoder.close()
    return stillPlayer(await loadImage(url, { keep: false }))
  }

  let index = 0
  let frame = (await decoder.decode({ frameIndex: 0 })).image

  const frameMs = (f: VideoFrame) => {
    const ms = (f.duration ?? 0) / 1000
    return ms >= MIN_FRAME_MS ? ms : DEFAULT_FRAME_MS
  }

  return {
    get image() {
      return frame
    },
    get durationMs() {
      return frameMs(frame)
    },
    animated: true,
    async next() {
      index = (index + 1) % frameCount
      const { image } = await decoder.decode({ frameIndex: index })
      frame.close()
      frame = image
    },
    close() {
      frame.close()
      decoder.close()
    },
  }
}
