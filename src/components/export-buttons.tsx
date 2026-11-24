import { useState } from 'react'
import { FilmIcon, ImageIcon, LoaderCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  downloadBlob,
  exportFileName,
  renderCardGif,
  renderCardPng,
} from '@/lib/export'

interface ExportButtonsProps {
  subject: string
  color: string
  places: string[]
  /** Index of the place currently on screen. */
  currentIndex: number
  /** URL of the card background, if any. */
  background?: string
}

export function ExportButtons({
  subject,
  color,
  places,
  currentIndex,
  background,
}: ExportButtonsProps) {
  // GIF export doesn't support backgrounds yet (on hold), so it's only
  // offered for the plain black card.
  const gifAvailable = !background
  const [busy, setBusy] = useState<'png' | 'gif' | null>(null)
  const [gifProgress, setGifProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const currentPlace = places[currentIndex] ?? places[0] ?? ''

  async function run(kind: 'png' | 'gif', task: () => Promise<void>) {
    setBusy(kind)
    setError(null)
    try {
      await task()
    } catch (e) {
      console.error(e)
      setError(`Couldn't create the ${kind.toUpperCase()}. Please try again.`)
    } finally {
      setBusy(null)
    }
  }

  const downloadPng = () =>
    run('png', async () => {
      const blob = await renderCardPng({ subject, color, location: currentPlace }, background)
      downloadBlob(blob, `${exportFileName(subject, currentPlace)}.png`)
    })

  const downloadGif = () =>
    run('gif', async () => {
      setGifProgress(0)
      const blob = await renderCardGif({ subject, color, places }, setGifProgress)
      // e.g. "worst-girl-in-13-places.gif", or the place's name if only one.
      const name = places.length > 1 ? `${places.length} places` : currentPlace
      downloadBlob(blob, `${exportFileName(subject, name)}.gif`)
    })

  return (
    <div className="flex flex-col items-center gap-2">
      <ButtonGroup aria-label="Download">
        <Button variant="outline" onClick={downloadPng} disabled={busy !== null}>
          {busy === 'png' ? (
            <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <ImageIcon data-icon="inline-start" />
          )}
          Download PNG
        </Button>
        <Button
          variant="outline"
          onClick={downloadGif}
          disabled={busy !== null || !gifAvailable}
          title={gifAvailable ? undefined : 'GIF download with backgrounds is coming soon'}
        >
          {busy === 'gif' ? (
            <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <FilmIcon data-icon="inline-start" />
          )}
          {busy === 'gif' ? `Making GIF… ${Math.round(gifProgress * 100)}%` : 'Download GIF'}
        </Button>
      </ButtonGroup>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
