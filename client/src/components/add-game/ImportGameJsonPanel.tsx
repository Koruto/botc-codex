import { useState } from 'react'
import type { GameDocument, GamePhase } from '@/types'
import type { MetaFormValues } from './MetaPanel'
import type { TownSquareGameState } from '@/types/townSquare.types'
import type { CustomScript, RoleInfo } from '@/types/grimoire.types'
import { Button } from '@/components/Button'

export type ImportGameJsonPanelProps = {
  onPrefill: (prefill: {
    townSquare: TownSquareGameState | null
    metaFormValues: Partial<MetaFormValues>
    phases: GamePhase[] | null
    title: string
    subtitle: string
    storyteller: string
    customScript: CustomScript | null
    customRoles: RoleInfo[]
  }) => void
  onSkip: () => void
}

export function ImportGameJsonPanel({ onPrefill, onSkip }: ImportGameJsonPanelProps) {
  const [pasteJson, setPasteJson] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    setError(null)
    let doc: Record<string, unknown>
    try {
      doc = JSON.parse(pasteJson) as Record<string, unknown>
    } catch {
      setError('Invalid JSON')
      return
    }
    if (!doc || typeof doc !== 'object') {
      setError('Invalid format')
      return
    }
    const d = doc as Partial<GameDocument>
    const townSquare = d.townSquare && typeof d.townSquare === 'object' && Array.isArray((d.townSquare as TownSquareGameState).players)
      ? (d.townSquare as TownSquareGameState)
      : null
    const meta = d.meta && typeof d.meta === 'object' ? d.meta as GameDocument['meta'] : undefined
    const phases = Array.isArray(d.phases) ? (d.phases as GamePhase[]) : null
    const metaFormValues: Partial<MetaFormValues> = {
      title: typeof d.title === 'string' ? d.title : '',
      subtitle: typeof d.subtitle === 'string' ? d.subtitle : '',
      playedOn: meta?.playedOn ?? '',
      edition: meta?.edition ?? '',
      winner: (d.winner === 'good' || d.winner === 'evil') ? d.winner : '',
    }
    const customScript = meta?.script && typeof meta.script === 'object' && Array.isArray((meta.script as CustomScript).roles)
      ? (meta.script as CustomScript)
      : null
    const customRoles = Array.isArray(meta?.customRoles) ? (meta?.customRoles as RoleInfo[]) : []

    onPrefill({
      townSquare,
      metaFormValues,
      phases,
      title: typeof d.title === 'string' ? d.title : '',
      subtitle: typeof d.subtitle === 'string' ? d.subtitle : '',
      storyteller: meta?.storyteller ?? '',
      customScript,
      customRoles,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const doc = JSON.parse(reader.result as string) as Record<string, unknown>
        setPasteJson(JSON.stringify(doc, null, 2))
      } catch {
        setError('Invalid JSON in file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-medium text-foreground">Import from game JSON (optional)</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Paste or upload a game document JSON (same format as our app uses) to prefill meta, players, and phases. Missing fields stay empty. You can also skip and start from scratch.
      </p>
      <div className="mb-4">
        <textarea
          value={pasteJson}
          onChange={(e) => { setPasteJson(e.target.value); setError(null) }}
          placeholder='{ "townSquare": { "players": [...] }, "meta": { ... }, "phases": [...] }'
          className="h-32 w-full rounded border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          rows={6}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
          id="import-game-json-file"
        />
        <Button variant="secondary" asChild>
          <label htmlFor="import-game-json-file" className="cursor-pointer">
            Upload JSON
          </label>
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!pasteJson.trim()}
        >
          Continue →
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </section>
  )
}
