/** Typing animation timings, in milliseconds. */
export const TYPING = {
  /** Time to type each character. */
  typeCharMs: 90,
  /** How long a fully typed place stays on screen. */
  holdMs: 1800,
  /** Time to delete each character. */
  deleteCharMs: 45,
  /** Pause with an empty line before the next place starts typing. */
  gapMs: 400,
  /** Caret blink half-period while holding or paused. */
  blinkMs: 530,
}

export interface TypingFrame {
  /** Which place is showing. */
  index: number
  /** How many characters of it are visible. */
  visible: number
  /** Whether the caret is drawn in this frame. */
  caret: boolean
  /** True once the animation has stopped for good (single place, fully typed). */
  done?: boolean
}

function placeDuration(length: number) {
  return (
    length * TYPING.typeCharMs +
    TYPING.holdMs +
    length * TYPING.deleteCharMs +
    TYPING.gapMs
  )
}

const blinkOn = (elapsed: number) => Math.floor(elapsed / TYPING.blinkMs) % 2 === 0

/**
 * The animation state at `elapsed` ms after it started, given the character
 * length of each place. With several places it loops forever through them in
 * order. With one place it types it once, then stays with no caret.
 * `lengths` must not be empty.
 */
export function typingFrameAt(
  lengths: number[],
  elapsed: number,
): TypingFrame {
  if (lengths.length === 1) {
    const [length] = lengths
    if (elapsed < length * TYPING.typeCharMs) {
      return { index: 0, visible: Math.floor(Math.max(0, elapsed) / TYPING.typeCharMs), caret: true }
    }
    return { index: 0, visible: length, caret: false, done: true }
  }

  const total = lengths.reduce((sum, len) => sum + placeDuration(len), 0)
  let t = ((elapsed % total) + total) % total

  for (let index = 0; index < lengths.length; index++) {
    const length = lengths[index]
    const duration = placeDuration(length)
    if (t >= duration) {
      t -= duration
      continue
    }
    const typeEnd = length * TYPING.typeCharMs
    const holdEnd = typeEnd + TYPING.holdMs
    const deleteEnd = holdEnd + length * TYPING.deleteCharMs

    if (t < typeEnd) {
      return { index, visible: Math.floor(t / TYPING.typeCharMs), caret: true }
    }
    if (t < holdEnd) {
      return { index, visible: length, caret: blinkOn(t - typeEnd) }
    }
    if (t < deleteEnd) {
      const deleted = Math.floor((t - holdEnd) / TYPING.deleteCharMs)
      return { index, visible: length - deleted, caret: true }
    }
    return { index, visible: 0, caret: blinkOn(t - deleteEnd) }
  }
  // Unreachable: t is always less than the total duration.
  return { index: 0, visible: lengths[0], caret: false }
}

/**
 * Length of one full run of the animation, in ms: one loop through every
 * place, or for a single place, typing it out and then `finalHoldMs` on the
 * finished card. `lengths` must not be empty.
 */
export function typingDuration(lengths: number[], finalHoldMs = 3000) {
  if (lengths.length === 1) return lengths[0] * TYPING.typeCharMs + finalHoldMs
  return lengths.reduce((sum, length) => sum + placeDuration(length), 0)
}
