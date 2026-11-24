// Minimal types for the parts of gifenc this app uses (the package ships none).
declare module 'gifenc' {
  export type Palette = number[][]

  export interface WriteFrameOptions {
    palette?: Palette
    /** Frame duration in milliseconds (stored in 1/100 s). */
    delay?: number
    /** -1 = play once, 0 = loop forever, n > 0 = loop n extra times. */
    repeat?: number
    /** Bits per pixel index, 1–8. */
    colorDepth?: number
    transparent?: boolean
    transparentIndex?: number
    dispose?: number
  }

  export interface Encoder {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: WriteFrameOptions,
    ): void
    finish(): void
    bytes(): Uint8Array<ArrayBuffer>
  }

  export function GIFEncoder(options?: { initialCapacity?: number; auto?: boolean }): Encoder
}
