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
    <ButtonGroup aria-label="Background">
      <Button variant="outline" size="icon" aria-label="Previous background" onClick={() => step(-1)}>
        <ChevronLeftIcon />
      </Button>
      {/* Fixed width, so the < and > buttons don't move as names change length. */}
      <ButtonGroupText className="w-44 justify-center tabular-nums" aria-live="polite">
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
