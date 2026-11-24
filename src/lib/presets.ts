export const DEFAULT_PLACES = ['Pop³', 'America']

/** Place lists prefilled when the page is opened at /<name>. */
const PRESETS: Record<string, string[]> = {
  popcubed: [
    'The Avenues',
    'Bransholme',
    'Orchard Park',
    'Cottingham',
    'Willerby',
    'Beverley',
    'Greatfield',
    'Gypsyville',
    'Hessle',
    'Kingswood',
    'Southcoates',
    'Sutton',
    'Longhill',
  ],
}

/**
 * Returns the preset for a URL path such as "/popcubed" (case-insensitive,
 * trailing slash allowed), or the default places if there isn't one.
 */
export function placesForPath(pathname: string) {
  const name = pathname.replace(/^\/+|\/+$/g, '').toLowerCase()
  return [...(PRESETS[name] ?? DEFAULT_PLACES)]
}
