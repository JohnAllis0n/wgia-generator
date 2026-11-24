import { useState } from 'react'
import { CardPreview } from '@/components/card-preview'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group'
import { useTintedFavicon } from '@/hooks/use-tinted-favicon'
import { COLORS, SUBJECTS, type CardColor, type Subject } from '@/lib/options'

export default function App() {
  const [subject, setSubject] = useState<Subject>('girl')
  const [color, setColor] = useState<CardColor>(COLORS[0].value)

  useTintedFavicon(color)

  return (
    <div className="min-h-svh">
      <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col items-center justify-center gap-6 p-4">
        <CardPreview subject={subject} location="America" color={color} />

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
      </main>
    </div>
  )
}
