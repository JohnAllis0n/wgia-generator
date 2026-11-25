import { useEffect, useState } from 'react'
import { FilmIcon, ImageIcon, LoaderCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  canRenderVideo,
  downloadBlob,
  exportFileName,
  renderCardPng,
  renderCardVideo,
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
  const [busy, setBusy] = useState<'png' | 'video' | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  /** Read out by screen readers: what's happening with the download. */
  const [status, setStatus] = useState('')
  // Until checked, assume the browser can make videos (most can).
  const [videoSupported, setVideoSupported] = useState(true)

  useEffect(() => {
    let cancelled = false
    canRenderVideo().then((ok) => {
      if (!cancelled) setVideoSupported(ok)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const currentPlace = places[currentIndex] ?? places[0] ?? ''

  async function run(kind: 'png' | 'video', label: string, task: () => Promise<void>) {
    setBusy(kind)
    setError(null)
    setStatus(`Making ${label}…`)
    try {
      await task()
      setStatus(`${label} downloaded.`)
    } catch (e) {
      console.error(e)
      setStatus('')
      setError(`Couldn't create the ${label}. Please try again.`)
    } finally {
      setBusy(null)
    }
  }

  const downloadPng = () =>
    run('png', 'PNG', async () => {
      const blob = await renderCardPng({ subject, color, location: currentPlace }, background)
      downloadBlob(blob, `${exportFileName(subject, currentPlace)}.png`)
    })

  const downloadVideo = () =>
    run('video', 'video', async () => {
      setVideoProgress(0)
      const blob = await renderCardVideo({ subject, color, places, background }, setVideoProgress)
      // e.g. "worst-girl-in-13-places.mp4", or the place's name if only one.
      const name = places.length > 1 ? `${places.length} places` : currentPlace
      downloadBlob(blob, `${exportFileName(subject, name)}.mp4`)
    })

  return (
    <div className="@container flex w-full flex-col items-center gap-2">
      {/* Full width, like the add-place group. On narrow cards the word
          "Download" is dropped so both buttons still fit. */}
      <ButtonGroup aria-label="Download" className="w-full">
        <Button
          variant="outline"
          className="min-w-0 flex-1"
          onClick={downloadPng}
          aria-label="Download PNG"
          disabled={busy !== null}
        >
          {busy === 'png' ? (
            <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <ImageIcon data-icon="inline-start" />
          )}
          <span>
            <span className="hidden @[18rem]:inline">Download </span>PNG
          </span>
        </Button>
        <Button
          variant="outline"
          className="min-w-0 flex-1"
          onClick={downloadVideo}
          aria-label={busy === 'video' ? undefined : 'Download MP4'}
          disabled={busy !== null || !videoSupported}
        >
          {busy === 'video' ? (
            <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <FilmIcon data-icon="inline-start" />
          )}
          {busy === 'video' ? (
            <span>
              <span className="hidden @[18rem]:inline">Making video… </span>
              {Math.round(videoProgress * 100)}%
            </span>
          ) : (
            <span>
              <span className="hidden @[18rem]:inline">Download </span>MP4
            </span>
          )}
        </Button>
      </ButtonGroup>
      {!videoSupported && (
        <p className="text-sm text-muted-foreground">
          This browser can't make videos. Try Chrome, Edge or Safari.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  )
}
