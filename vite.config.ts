import { readdirSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BACKGROUNDS_DIR = path.resolve(import.meta.dirname, 'public/backgrounds')
const IMAGE_FILE = /\.(jpe?g|png|gif|webp|avif)$/i

/**
 * Encodes only what a file name needs to be a valid URL path (spaces,
 * non-ASCII, "#", "?", "%"). Characters that are already safe, like "$",
 * stay as they are: the static file server doesn't decode some escapes
 * (e.g. "%24" for "$"), so over-encoding makes the file 404.
 */
function encodeFileName(file: string) {
  return encodeURI(file).replace(/[#?]/g, (c) => encodeURIComponent(c))
}

/**
 * Provides `virtual:backgrounds`: the URLs of every image in
 * public/backgrounds, sorted by name. Adding or removing a file there
 * reloads the dev page with the new list.
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
      const files = readdirSync(BACKGROUNDS_DIR)
        .filter((file) => IMAGE_FILE.test(file))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      const urls = files.map((file) => `/backgrounds/${encodeFileName(file)}`)
      return `export default ${JSON.stringify(urls)}`
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

export default defineConfig({
  plugins: [react(), tailwindcss(), backgrounds()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
