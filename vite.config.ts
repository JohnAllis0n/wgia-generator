import { readdirSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BACKGROUNDS_DIR = path.resolve(import.meta.dirname, 'public/backgrounds')
const IMAGE_FILE = /\.(jpe?g|png|gif|webp|avif)$/i

/** The background the card starts with (falls back to the first if missing). */
const DEFAULT_BACKGROUND_FILE = 'Firework$.webp'

/** The Geist font file that the page's Latin text uses. */
const UI_FONT_FILE = /geist-latin-wght-normal.*\.woff2$/

/**
 * Encodes only what a file name needs to be a valid URL path (spaces,
 * non-ASCII, "#", "?", "%"). Characters that are already safe, like "$",
 * stay as they are: the static file server doesn't decode some escapes
 * (e.g. "%24" for "$"), so over-encoding makes the file 404.
 */
function encodeFileName(file: string) {
  return encodeURI(file).replace(/[#?]/g, (c) => encodeURIComponent(c))
}

/** URLs of every image in public/backgrounds, sorted by name. */
function backgroundUrls() {
  return readdirSync(BACKGROUNDS_DIR)
    .filter((file) => IMAGE_FILE.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => `/backgrounds/${encodeFileName(file)}`)
}

/** Index of the background the card starts with. */
function defaultBackgroundIndex(urls: string[]) {
  const wanted = `/backgrounds/${encodeFileName(DEFAULT_BACKGROUND_FILE)}`
  return Math.max(0, urls.indexOf(wanted))
}

/**
 * Provides `virtual:backgrounds`: the URLs of every image in
 * public/backgrounds, sorted by name, and which one to start with. Adding or
 * removing a file there reloads the dev page with the new list.
 *
 * It also preloads the starting background from the HTML, so the browser
 * fetches it (the page's largest image) before the JavaScript has run.
 */
function backgrounds(): Plugin {
  const id = 'virtual:backgrounds'
  const resolvedId = `\0${id}`
  return {
    name: 'backgrounds',
    resolveId(source) {
      if (source === id) return resolvedId
    },
    load(loadId) {
      if (loadId !== resolvedId) return
      const urls = backgroundUrls()
      return [
        `export default ${JSON.stringify(urls)}`,
        `export const defaultIndex = ${defaultBackgroundIndex(urls)}`,
      ].join('\n')
    },
    transformIndexHtml() {
      const urls = backgroundUrls()
      if (urls.length === 0) return
      return [
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'image',
            href: urls[defaultBackgroundIndex(urls)],
            fetchpriority: 'high',
          },
          injectTo: 'head',
        },
      ]
    },
    configureServer(server) {
      server.watcher.add(BACKGROUNDS_DIR)
      const onChange = (file: string) => {
        if (path.dirname(path.resolve(file)) !== BACKGROUNDS_DIR) return
        const module = server.moduleGraph.getModuleById(resolvedId)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}

/**
 * Preloads the page's Geist font from the HTML (production builds only, where
 * the file has its final hashed name). Otherwise the browser only finds it
 * after the CSS has loaded, and the text reflows when it swaps in.
 */
function preloadUiFont(): Plugin {
  return {
    name: 'preload-ui-font',
    apply: 'build',
    transformIndexHtml(_html, ctx) {
      const font = Object.keys(ctx.bundle ?? {}).find((file) => UI_FONT_FILE.test(file))
      if (!font) return
      return [
        {
          tag: 'link',
          attrs: { rel: 'preload', href: `/${font}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head',
        },
      ]
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), backgrounds(), preloadUiFont()],
  build: {
    // Lets browser dev tools (and Lighthouse) map minified code back to the source.
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
