import backgroundUrls, { defaultIndex } from 'virtual:backgrounds'

/** Every card background, from public/backgrounds, sorted by name. */
export const BACKGROUNDS = backgroundUrls

/**
 * The background the card starts with. Set in vite.config.ts, which also
 * preloads it from the HTML.
 */
export const DEFAULT_BACKGROUND_INDEX = defaultIndex

/** The file name from a background URL, e.g. "Fireworks 2.gif". */
function backgroundFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() ?? '')
}

/** A short label for a background URL, e.g. "Fireworks 2". */
export function backgroundLabel(url: string) {
  return backgroundFileName(url).replace(/\.[^.]+$/, '')
}
