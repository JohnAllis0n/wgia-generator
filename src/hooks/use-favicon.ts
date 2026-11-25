import { useEffect } from 'react'
import type { CardColor } from '@/lib/options'

/** The favicon for each card colour. */
const ICONS: Record<CardColor, string> = {
  '#e91516': '/wgia-red.png',
  '#08eaeb': '/wgia-cyan.png',
}

/** Shows the favicon that matches the card's colour. */
export function useFavicon(color: CardColor) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (link) link.href = ICONS[color]
  }, [color])
}
