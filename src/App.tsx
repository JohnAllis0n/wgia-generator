import { useState } from 'react'
import { BackgroundPicker } from '@/components/background-picker'
import { CardPreview } from '@/components/card-preview'
import { ExportButtons } from '@/components/export-buttons'
import { PlacesInput } from '@/components/places-input'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group'
import { useTintedFavicon } from '@/hooks/use-tinted-favicon'
import { BACKGROUNDS, DEFAULT_BACKGROUND_INDEX } from '@/lib/backgrounds'
import { COLORS, SUBJECTS, type CardColor, type Subject } from '@/lib/options'
import { placesForPath } from '@/lib/presets'

export default function App() {
  const [subject, setSubject] = useState<Subject>('girl')
  const [color, setColor] = useState<CardColor>(COLORS[0].value)
  const [places, setPlaces] = useState(() =>
    placesForPath(window.location.pathname),
  )
  /** Which place the preview is showing, for the PNG download. */
  const [currentIndex, setCurrentIndex] = useState(0)
  const [backgroundIndex, setBackgroundIndex] = useState(DEFAULT_BACKGROUND_INDEX)
  const background = BACKGROUNDS[backgroundIndex]

  useTintedFavicon(color)

  return (
    <main className="min-h-svh md:grid md:grid-cols-2">
      {/*
        The card and its background picker have their own area, centred on
        screen. Nothing else affects their position, so adding places never
        moves the card. On wider screens it also stays in place while the
        controls column scrolls.
      */}
      <section
        aria-label="Preview"
        className="flex min-h-[85svh] flex-col items-center justify-center gap-3 p-4 md:sticky md:top-0 md:h-svh md:min-h-0"
      >
        <CardPreview
          subject={subject}
          color={color}
          places={places}
          onPlaceChange={setCurrentIndex}
          background={background}
        />
        <BackgroundPicker index={backgroundIndex} onChange={setBackgroundIndex} />
      </section>

      <section
        aria-label="Options"
        className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 px-4 pb-10 md:min-h-svh md:justify-center md:py-10"
      >
        <ButtonGroup aria-label="Card options">
          {SUBJECTS.map((s) => (
            <Button
              key={s}
              variant={subject === s ? 'default' : 'outline'}
              aria-pressed={subject === s}
              onClick={() => setSubject(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}

          <ButtonGroupSeparator />

          {COLORS.map((c) => (
            <Button
              key={c.value}
              variant={color === c.value ? 'default' : 'outline'}
              aria-pressed={color === c.value}
              onClick={() => setColor(c.value)}
            >
              <span
                aria-hidden
                className="size-3.5 rounded-full border border-black/20"
                style={{ backgroundColor: c.value }}
              />
              {c.name}
            </Button>
          ))}
        </ButtonGroup>

        <ExportButtons
          subject={subject}
          color={color}
          places={places}
          currentIndex={currentIndex}
          background={background}
        />

        <PlacesInput places={places} onChange={setPlaces} />
      </section>
    </main>
  )
}
