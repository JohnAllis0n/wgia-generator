import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import { BACKGROUNDS, backgroundLabel } from '@/lib/backgrounds'

interface BackgroundPickerProps {
  index: number
  onChange: (index: number) => void
}

/** Previous / next buttons for stepping through the card backgrounds. */
export function BackgroundPicker({ index, onChange }: BackgroundPickerProps) {
  const count = BACKGROUNDS.length
  if (count === 0) return null

  // Wrap around at either end.
  const step = (delta: number) => onChange((index + delta + count) % count)

  return (
    // Same width as the card (--card-width is set by CardPreview); the name
    // fills the middle, so the < and > buttons never move as names change.
    <ButtonGroup aria-label="Background" className="w-(--card-width)">
      <Button variant="outline" size="icon" aria-label="Previous background" onClick={() => step(-1)}>
        <ChevronLeftIcon />
      </Button>
      <ButtonGroupText className="min-w-0 flex-1 justify-center tabular-nums" aria-live="polite">
        <span className="truncate">{backgroundLabel(BACKGROUNDS[index])}</span>
        <span className="shrink-0 text-muted-foreground">
          {index + 1}/{count}
        </span>
      </ButtonGroupText>
      <Button variant="outline" size="icon" aria-label="Next background" onClick={() => step(1)}>
        <ChevronRightIcon />
      </Button>
    </ButtonGroup>
  )
}
