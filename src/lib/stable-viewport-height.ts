/**
 * Sets --app-height on <html> to the window's height, and only updates it
 * when the width changes too (e.g. the phone is rotated).
 *
 * Viewport units like svh should stay fixed while scrolling, but some mobile
 * browsers resize the whole page when their toolbars collapse, so svh changes
 * and the card would grow and shrink as you scroll. A height that ignores
 * height-only changes keeps the layout still.
 */
export function trackStableViewportHeight() {
  const root = document.documentElement
  let lastWidth = -1

  const update = () => {
    const width = window.innerWidth
    if (width === lastWidth) return
    lastWidth = width
    root.style.setProperty('--app-height', `${window.innerHeight}px`)
  }

  update()
  window.addEventListener('resize', update)
}
