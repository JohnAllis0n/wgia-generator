declare module 'virtual:backgrounds' {
  /** URLs of every image in public/backgrounds, sorted by name. */
  const backgrounds: string[]
  export default backgrounds
  /** Index of the background the card starts with (set in vite.config.ts). */
  export const defaultIndex: number
}
