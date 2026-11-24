# WGIA Generator

Make "WOR$T GIRL IN \<PLACE\>" cards: 1080×1920 images sized for phone stories. Type any number of places and the preview cycles through them with a typing animation. You can then download a PNG of the current place, or an MP4 video of the whole cycle.

## Features

- **Girl / Man** switch for the headline ("WOR$T GIRL IN" or "WOR$T MAN IN").
- **Two colours:** red `#e91516` and cyan `#08eaeb`. The favicon changes to match.
- **Places list:** add places, remove them one at a time, or clear them all. Every `S` is shown as `$`. Long names shrink or wrap onto up to three lines, and the headline stays in the same spot.
- **Typing animation** with a slanted caret. With a single place, it types once and the caret goes away.
- **Backgrounds:** step through the images in `public/backgrounds` with the < > buttons. Animated GIFs play in the preview.
- **Downloads:**
  - **PNG** of the place currently on screen, including the background.
  - **MP4** (1080×1920, 30 fps) of the full typing cycle, with animated backgrounds moving behind the text. It needs a browser that can encode H.264 video (Chrome, Edge or Safari).
- **Presets:** going to `/<name>` fills in a saved list of places (for example `/popcubed`).

## Getting started

```sh
npm install
npm run dev       # start a local dev server
npm run build     # type-check and build to dist/
npm run preview   # serve the built site locally
```

## Customising

| What | Where |
| --- | --- |
| Default places | `DEFAULT_PLACES` in `src/lib/presets.ts` |
| URL presets (`/<name>`) | `PRESETS` in `src/lib/presets.ts` |
| Colours and their labels | `COLORS` in `src/lib/options.ts` |
| Subjects (girl / man) | `SUBJECTS` in `src/lib/options.ts` |
| Animation timing | `TYPING` in `src/lib/typing.ts` |
| Card size, padding, text sizes | constants at the top of `src/lib/card.ts` |
| Default background | `DEFAULT_BACKGROUND_FILE` in `src/lib/backgrounds.ts` |
| Page heading | `HEADING` in `src/components/page-heading.tsx` |

### Backgrounds

To add a background, put any `.jpg`, `.png`, `.gif`, `.webp` or `.avif` file in `public/backgrounds/`. The list is read when the app is built, and the dev server reloads when you add or remove a file. The picker shows each file's name without its extension, sorted by name. Images are used exactly as they are, with no resizing or recompression.

## Deploying

`npm run build` creates a static site in `dist/`, which you can host anywhere. If you use the presets, set up your host to serve `index.html` for unknown paths (an SPA fallback) so that links like `/popcubed` load. Backgrounds and fonts never change between builds, so long cache lifetimes are safe for them.

## Tech

[Vite](https://vite.dev), React 19, TypeScript, Tailwind CSS v4 and [shadcn/ui](https://ui.shadcn.com). The card is drawn on a `<canvas>`, and videos are made in the browser with [Mediabunny](https://mediabunny.dev) (loaded only when needed).

- `src/lib/card.ts`: card layout and drawing
- `src/lib/typing.ts`: typing animation timeline
- `src/lib/export.ts`: PNG and MP4 export
- `src/lib/background-frames.ts`: steps through animated backgrounds frame by frame for the video
- `src/components/`: UI (`ui/` holds the shadcn components)
- `vite.config.ts`: includes the plugin that lists `public/backgrounds`

The card font is Futura Bold Oblique (`public/fonts/futura-bold-oblique.ttf`). It's a repaired copy of the original, which browsers rejected. You need the rights to use the font wherever you deploy.

## License

See [LICENSE](LICENSE).
