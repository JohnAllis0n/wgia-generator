const cache = new Map<string, Promise<HTMLImageElement>>()

/** Loads an image once per URL; later calls reuse the same promise. */
export function loadImage(src: string) {
  let promise = cache.get(src)
  if (!promise) {
    promise = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      img.src = src
    })
    cache.set(src, promise)
  }
  return promise
}
