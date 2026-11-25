import { useState } from 'react'
import { BackgroundPicker } from '@/components/background-picker'
import { CardPreview } from '@/components/card-preview'
import { ExportButtons } from '@/components/export-buttons'
import { PageHeading } from '@/components/page-heading'
import { PlacesInput } from '@/components/places-input'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { usePrefetchBackgrounds } from '@/hooks/use-prefetch-backgrounds'
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
  usePrefetchBackgrounds(backgroundIndex)

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
        {/* On phones the heading sits above the card; on desktop, above the controls. */}
        <PageHeading className="mb-1 md:hidden" />
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
        className="flex w-full flex-col items-center px-4 pb-10 md:min-h-svh md:justify-center md:py-4"
      >
        {/*
          On wider screens this block is centred like the preview and at least
          as tall as it (card, 12px gap, 32px picker), so the heading lines up
          with the top of the card and the credits with the bottom of the picker.
        */}
        <div className="flex w-full max-w-xl flex-col items-center gap-6 md:min-h-[calc(var(--card-width)*16/9+44px)] md:justify-between">
          <PageHeading className="hidden md:block" />

          {/* Both cards match the preview card's width (--card-width, set by CardPreview). */}
          <Card className="w-(--card-width) max-w-full">
            <CardContent className="flex flex-col items-center gap-6">
              <ButtonGroup aria-label="Card options" className="w-full">
                {SUBJECTS.map((s) => (
                  <Button
                    key={s}
                    variant={subject === s ? 'default' : 'outline'}
                    aria-pressed={subject === s}
                    onClick={() => setSubject(s)}
                    className="flex-1 capitalize"
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
                    className="flex-1"
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

              <div className="w-full">
                <PlacesInput places={places} onChange={setPlaces} />
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <ExportButtons
                subject={subject}
                color={color}
                places={places}
                currentIndex={currentIndex}
                background={background}
              />
            </CardFooter>
          </Card>

          <Card size="sm" className="w-(--card-width) max-w-full">
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Created By John Alli<span style={{ color: COLORS[0].value }}>$</span>on
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Not affiliated with Slayyyter or Sony Music Entertainment.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
