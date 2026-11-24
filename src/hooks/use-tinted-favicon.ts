import { useEffect } from 'react'
import { loadImage } from '@/lib/load-image'

const ICON_SRC = '/wgia-cyan.png'
const ICON_SIZE = 64

/**
 * Recolours the favicon to `color`. The icon is a single-colour shape on a
 * transparent background, so filling with "source-in" keeps its shape and
 * swaps the colour.
 */
export function useTintedFavicon(color: string) {
  useEffect(() => {
    let cancelled = false

    loadImage(ICON_SRC).then(
      (img) => {
        if (cancelled) return
        const canvas = document.createElement('canvas')
        canvas.width = ICON_SIZE
        canvas.height = ICON_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0, ICON_SIZE, ICON_SIZE)
        ctx.globalCompositeOperation = 'source-in'
        ctx.fillStyle = color
        ctx.fillRect(0, 0, ICON_SIZE, ICON_SIZE)

        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          document.head.append(link)
        }
        link.type = 'image/png'
        link.href = canvas.toDataURL('image/png')
      },
      (error) => console.error('Favicon failed to load', error),
    )

    return () => {
      cancelled = true
    }
  }, [color])
}
