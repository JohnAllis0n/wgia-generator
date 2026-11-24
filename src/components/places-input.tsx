import { useState, type FormEvent } from 'react'
import { PlusIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'

export const MAX_PLACE_LENGTH = 40

interface PlacesInputProps {
  places: string[]
  onChange: (places: string[]) => void
}

export function PlacesInput({ places, onChange }: PlacesInputProps) {
  const [draft, setDraft] = useState('')

  const trimmed = draft.trim().replace(/\s+/g, ' ')
  const isDuplicate = places.some(
    (p) => p.toLowerCase() === trimmed.toLowerCase(),
  )

  function addPlace(event: FormEvent) {
    event.preventDefault()
    if (!trimmed || isDuplicate) return
    onChange([...places, trimmed])
    setDraft('')
  }

  function removePlace(index: number) {
    onChange(places.filter((_, i) => i !== index))
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <form onSubmit={addPlace}>
        <ButtonGroup className="w-full">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a place..."
            aria-label="Place"
            aria-invalid={isDuplicate || undefined}
            maxLength={MAX_PLACE_LENGTH}
            autoComplete="off"
            enterKeyHint="done"
          />
          <Button type="submit" variant="outline" disabled={!trimmed || isDuplicate}>
            <PlusIcon data-icon="inline-start" />
            Add
          </Button>
        </ButtonGroup>
      </form>

      {isDuplicate && (
        <p className="text-sm text-destructive">That place is already in the list.</p>
      )}

      {places.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <ul className="contents" aria-label="Places">
            {places.map((place, i) => (
              <li key={place} className="max-w-full">
                <Badge
                  variant="secondary"
                  className="h-7 max-w-full gap-1 pr-1 pl-3 text-sm"
                  title={place}
                >
                  <span className="truncate">{place}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-full"
                    aria-label={`Remove ${place}`}
                    onClick={() => removePlace(i)}
                  >
                    <XIcon />
                  </Button>
                </Badge>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" onClick={() => onChange([])}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
