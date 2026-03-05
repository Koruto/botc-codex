import { useState } from 'react'
import { Grimoire } from '@/components/Grimoire'
import type { RoleOption } from '@/types'
import type { TownSquareGameState, TownSquarePlayer } from '@/types/townSquare.types'
import type { DerivedGame } from '@/types'

export type ImportPanelProps = {
  townSquare: TownSquareGameState | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  loading: boolean
  rolesList: RoleOption[]
  derivedGame: DerivedGame | null
  onFileUpload: (file: File) => Promise<void>
  onPasteSubmit: (json: string) => Promise<void>
  onReplaceWithPaste: (json: string) => Promise<void>
  onUpdateTownSquare: (ts: TownSquareGameState) => void
  onNext: () => void
}

export function ImportPanel({
  townSquare,
  saveStatus,
  loading,
  rolesList,
  derivedGame,
  onFileUpload,
  onPasteSubmit,
  onReplaceWithPaste,
  onUpdateTownSquare,
  onNext,
}: ImportPanelProps) {
  const [pasteJson, setPasteJson] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const validateAndParseJson = (raw: string): Record<string, unknown> | null => {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      setPasteError('Invalid JSON')
      return null
    }
    const obj = parsed as Record<string, unknown>
    if (!obj || !Array.isArray(obj.players)) {
      setPasteError('JSON must have a "players" array (Town Square format)')
      return null
    }
    return obj
  }

  const handleFileUpload = async (file: File) => {
    setUploadError(null)
    try {
      await onFileUpload(file)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    }
  }

  const handlePasteSubmit = async () => {
    setPasteError(null)
    if (!validateAndParseJson(pasteJson)) return
    try {
      await onPasteSubmit(pasteJson)
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : 'Validation failed')
    }
  }

  const handleReplaceWithPaste = async () => {
    setPasteError(null)
    if (!validateAndParseJson(pasteJson)) return
    try {
      await onReplaceWithPaste(pasteJson)
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : 'Validation failed')
    }
  }

  const updatePlayer = (index: number, upd: Partial<Pick<TownSquarePlayer, 'name' | 'role'>>) => {
    if (!townSquare) return
    onUpdateTownSquare({
      ...townSquare,
      players: townSquare.players.map((p, i) => (i === index ? { ...p, ...upd } : p)),
    })
  }

  const addPlayer = () => {
    if (!townSquare) return
    const newPlayer: TownSquarePlayer = {
      id: `player-${townSquare.players.length + 1}`,
      name: '',
      role: rolesList[0]?.id ?? '',
      reminders: [],
      isVoteless: false,
      isDead: false,
      pronouns: '',
    }
    onUpdateTownSquare({ ...townSquare, players: [...townSquare.players, newPlayer] })
  }

  const removePlayer = (index: number) => {
    if (!townSquare || townSquare.players.length <= 1) return
    onUpdateTownSquare({
      ...townSquare,
      players: townSquare.players.filter((_, i) => i !== index),
    })
  }

  const hasImported = townSquare !== null

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-medium text-foreground">Import grimoire</h2>

      {/* Upload */}
      <div className="mb-6">
        <p className="mb-2 text-sm text-muted-foreground">Upload grimoire image</p>
        <div
          className={`flex flex-col items-center justify-center rounded border-2 border-dashed py-10 text-muted-foreground transition-colors ${
            loading ? 'border-primary/50 bg-muted/50' : 'border-input hover:border-primary hover:bg-muted/30'
          }`}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f && f.type.startsWith('image/')) handleFileUpload(f)
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            id="grimoire-upload"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileUpload(f)
            }}
          />
          <label
            htmlFor="grimoire-upload"
            className={`cursor-pointer text-center ${loading ? 'pointer-events-none opacity-70' : ''}`}
          >
            {loading ? (
              <p className="mb-2">Processing…</p>
            ) : (
              <>
                <p className="mb-2">Drag and drop an image here, or click to select.</p>
                <p className="text-sm">Supports: PNG, JPG (max 10 MB)</p>
              </>
            )}
          </label>
        </div>
        {uploadError && <p className="mt-2 text-sm text-red-400">{uploadError}</p>}
      </div>

      {/* Paste JSON */}
      <div className="mb-6">
        <p className="mb-2 text-sm text-muted-foreground">
          Or paste Town Square JSON (from Clocktower Online → Game State → Copy JSON)
        </p>
        <textarea
          value={pasteJson}
          onChange={(e) => {
            setPasteJson(e.target.value)
            setPasteError(null)
          }}
          placeholder='{ "players": [...], "edition": { "id": "bmr" }, ... }'
          className="h-32 w-full rounded border border-input bg-background px-3 py-2 font-mono text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          rows={6}
        />
        {pasteError && <p className="mt-1 text-sm text-red-400">{pasteError}</p>}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handlePasteSubmit}
            disabled={loading}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Use pasted JSON'}
          </button>
          {hasImported && (
            <button
              type="button"
              onClick={handleReplaceWithPaste}
              disabled={loading}
              className="rounded border border-input px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
            >
              Replace with pasted JSON
            </button>
          )}
        </div>
      </div>

      {/* After import: editable game state + grimoire preview */}
      {hasImported && derivedGame && townSquare && (
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="mb-3 text-md font-medium text-foreground">Game state</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Edit player names and roles below. Roles are stored by id; changes update the grimoire preview in real time.
          </p>
          <div className="mb-4 overflow-x-auto rounded-lg border border-border bg-muted/50">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Player name</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {townSquare.players.map((player, i) => (
                  <tr key={player.id || i} className="border-b border-border last:border-0">
                    <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-1.5">
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => updatePlayer(i, { name: e.target.value })}
                        placeholder="Name"
                        className="w-full rounded border border-input bg-background px-2 py-1 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={player.role}
                        onChange={(e) => updatePlayer(i, { role: e.target.value })}
                        className="w-full min-w-[140px] rounded border border-input bg-background px-2 py-1 text-foreground focus:border-primary focus:outline-none"
                      >
                        {!rolesList.some((r) => r.id === player.role) && player.role && (
                          <option value={player.role}>{player.role} (unknown)</option>
                        )}
                        {rolesList.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => removePlayer(i)}
                        disabled={townSquare.players.length <= 1}
                        className="rounded p-1 text-stone-400 hover:bg-stone-700 hover:text-red-400 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone-400"
                        title="Remove player"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-border px-3 py-2">
              <button
                type="button"
                onClick={addPlayer}
                className="rounded border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                + Add player
              </button>
            </div>
          </div>

          <h3 className="mb-3 text-md font-medium text-foreground">Grimoire preview</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            You can also paste new JSON above and click &quot;Replace with pasted JSON&quot; to overwrite.
          </p>
          <div className="flex justify-center rounded-lg border border-border bg-card p-4">
            <div className="w-full max-w-[min(360px,85vw)]">
              <Grimoire
                isPreGame
                isDay={false}
                totalPlayers={derivedGame.players.length}
                aliveCount={derivedGame.players.length}
                voteCount={derivedGame.players.length}
                currentPhaseIndex={0}
                narrativePlayers={derivedGame.players.map((p) => ({ name: p.name, deathAtPhase: null }))}
                players={derivedGame.players.map((p) => ({ id: p.id, name: p.name, role: p.roleId }))}
                ghostVotesUsedIds={[]}
                storytellerName=""
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={onNext}
              disabled={loading}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Continue to Meta
            </button>
            {saveStatus === 'saved' && <span className="text-sm text-green-400">Draft saved</span>}
            {saveStatus === 'error' && <span className="text-sm text-red-400">Save failed</span>}
          </div>
        </div>
      )}
    </section>
  )
}
