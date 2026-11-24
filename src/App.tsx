import { CardPreview } from '@/components/card-preview'

export default function App() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <CardPreview subject="girl" location="America" color="#e91516" />
      </div>
    </main>
  )
}
