const cache = new Map<string, Promise<HTMLImageElement>>()

function fetchImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * Loads an image. By default it's kept, so later calls reuse it (good for
 * small images used often, like the favicon). Pass `{ keep: false }` for
 * large one-off uses, such as drawing a background into a download, so the
 * decoded image can be freed afterwards.
 */
export function loadImage(src: string, { keep = true } = {}) {
  if (!keep) return cache.get(src) ?? fetchImage(src)
  let promise = cache.get(src)
  if (!promise) {
    promise = fetchImage(src)
    // Don't remember failures, so a later call can try again.
    promise.catch(() => cache.delete(src))
    cache.set(src, promise)
  }
  return promise
}
