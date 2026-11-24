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
      <ButtonGroupText className="min-w-32 justify-center tabular-nums" aria-live="polite">
        {backgroundLabel(BACKGROUNDS[index])}
        <span className="text-muted-foreground">
          {index + 1}/{count}
        </span>
      </ButtonGroupText>
      <Button variant="outline" size="icon" aria-label="Next background" onClick={() => step(1)}>
        <ChevronRightIcon />
      </Button>
    </ButtonGroup>
  )
}
