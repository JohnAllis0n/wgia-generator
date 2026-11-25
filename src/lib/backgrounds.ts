import backgroundUrls from 'virtual:backgrounds'

/** Every card background, from public/backgrounds, sorted by name. */
export const BACKGROUNDS = backgroundUrls

/** The background the card starts with. */
const DEFAULT_BACKGROUND_FILE = 'Firework$.webp'

/** The file name from a background URL, e.g. "Fireworks 2.gif". */
function backgroundFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() ?? '')
}

/** Falls back to the first background if the default file isn't there. */
export const DEFAULT_BACKGROUND_INDEX = Math.max(
  0,
  BACKGROUNDS.findIndex((url) => backgroundFileName(url) === DEFAULT_BACKGROUND_FILE),
)

/** A short label for a background URL, e.g. "Fireworks 2". */
export function backgroundLabel(url: string) {
  return backgroundFileName(url).replace(/\.[^.]+$/, '')
}
