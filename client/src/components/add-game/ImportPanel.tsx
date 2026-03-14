import { useState } from 'react'
import { Grimoire } from '@/components/Grimoire'
import type { RoleOption } from '@/types'
import type { CustomScript, RoleInfo } from '@/types/grimoire.types'
import type { TownSquareGameState, TownSquarePlayer } from '@/types/townSquare.types'
import type { DerivedGame } from '@/types'
import { suggestEditionForRoleIds, EDITION_LABELS, getRolesList } from '@/utils/roles'
import { Button } from '@/components/Button'
import { X } from 'lucide-react'

const allRolesMap = new Map(getRolesList().map((r) => [r.id, r.name]))

const DEFAULT_SCRIPT_META = { id: '_meta' as const, name: '', author: '' }

export type ImportPanelProps = {
  townSquare: TownSquareGameState | null
  saving: boolean
  loading: boolean
  rolesList: RoleOption[]
  /** Role options for bluffs (townsfolk + outsider only). Falls back to rolesList if not provided. */
  bluffsRoleList?: RoleOption[]
  derivedGame: DerivedGame | null
  edition?: string
  customScript?: CustomScript | null
  customRoles?: RoleInfo[]
  storyteller: string
  onCustomScriptChange?: (script: CustomScript | null) => void
  onCustomRolesChange?: (roles: RoleInfo[]) => void
  onFileUpload: (file: File) => Promise<void>
  onPasteSubmit: (json: string) => Promise<void>
  onReplaceWithPaste: (json: string) => Promise<void>
  onUpdateTownSquare: (ts: TownSquareGameState) => void
  onStorytellerChange: (value: string) => void
  onBack: () => void
  onNext: () => void
  /** When most roles are unknown, suggest switching script. Only for base editions (tb/bmr/snv). */
  onSwitchScript?: (edition: 'tb' | 'bmr' | 'snv') => void
  /** Save current import/game state to draft. */
  onSaveDraft?: () => void | Promise<void>
}

export function ImportPanel({
  townSquare,
  saving,
  loading,
  rolesList,
  bluffsRoleList,
  derivedGame,
  edition,
  customScript,
  customRoles = [],
  storyteller,
  onCustomScriptChange,
  onCustomRolesChange,
  onFileUpload,
  onPasteSubmit,
  onReplaceWithPaste,
  onUpdateTownSquare,
  onStorytellerChange,
  onBack,
  onNext,
  onSwitchScript,
  onSaveDraft,
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
          className={`flex flex-col items-center justify-center rounded border-2 border-dashed py-10 text-muted-foreground transition-colors ${loading ? 'border-primary/50 bg-muted/50' : 'border-input hover:border-primary hover:bg-muted/30'
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
          <Button
            type="button"
            variant="primary"
            onClick={handlePasteSubmit}
            disabled={loading}
          >
            {loading ? 'Processing…' : 'Use pasted JSON'}
          </Button>
          {hasImported && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleReplaceWithPaste}
              disabled={loading}
            >
              Replace with pasted JSON
            </Button>
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
          {(() => {
            const roleIds = townSquare.players.map((p) => p.role).filter(Boolean)
            const isBaseEdition = edition === 'tb' || edition === 'bmr' || edition === 'snv'
            const suggestedEdition = isBaseEdition ? suggestEditionForRoleIds(edition ?? '', roleIds) : null
            const showBanner = Boolean(isBaseEdition && suggestedEdition && onSwitchScript)

            return showBanner ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
                <span>
                  Most roles match {EDITION_LABELS[suggestedEdition!]} better than {EDITION_LABELS[edition!] ?? edition}. This might be {EDITION_LABELS[suggestedEdition!]}.
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onSwitchScript?.(suggestedEdition!)
                  }}
                >
                  Switch to {EDITION_LABELS[suggestedEdition!]}
                </Button>
              </div>
            ) : null
          })()}
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
                          <option value={player.role}>{player.role} (not in script)</option>
                        )}
                        {rolesList.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePlayer(i)}
                        disabled={townSquare.players.length <= 1}
                        title="Remove player"
                      >
                        <X className="size-3.5" />
                      </Button>
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

          {/* Demon bluffs */}
          <div className="mb-4">
            <span className="mb-2 block text-sm font-medium text-foreground">Bluffs</span>
            <div className="flex flex-wrap items-center gap-2">
              {[0, 1, 2].map((i) => {
                const currentBluff = townSquare.bluffs?.[i] ?? ''
                const bluffOptions = bluffsRoleList ?? rolesList
                const inList = !currentBluff || bluffOptions.some((r) => r.id === currentBluff)
                const fallbackName = !inList ? (allRolesMap.get(currentBluff) ?? currentBluff) : ''
                return (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{i + 1}.</span>
                    <select
                      value={currentBluff}
                      onChange={(e) => {
                        const next = [...(townSquare.bluffs ?? [])]
                        while (next.length < i + 1) next.push('')
                        next[i] = e.target.value
                        onUpdateTownSquare({ ...townSquare, bluffs: next.filter(Boolean).length ? next : [] })
                      }}
                      className="min-w-[120px] rounded border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">—</option>
                      {!inList && currentBluff && (
                        <option value={currentBluff}>{fallbackName} (not in script)</option>
                      )}
                      {bluffOptions.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </span>
                )
              })}
            </div>
          </div>

          {/* Storyteller */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-foreground">Storyteller</label>
            <input
              type="text"
              value={storyteller}
              onChange={(e) => onStorytellerChange(e.target.value)}
              placeholder="e.g. Ele"
              className="w-full max-w-xs rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {edition === 'custom' && onCustomScriptChange && onCustomRolesChange && (
            <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-3 text-md font-medium text-foreground">Custom script & roles</h3>
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Script name</label>
                    <input
                      type="text"
                      value={customScript?.meta?.name ?? ''}
                      onChange={(e) =>
                        onCustomScriptChange({
                          meta: { ...DEFAULT_SCRIPT_META, ...customScript?.meta, name: e.target.value },
                          roles: customScript?.roles ?? [],
                        })
                      }
                      placeholder="e.g. My Homebrew"
                      className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Author</label>
                    <input
                      type="text"
                      value={customScript?.meta?.author ?? ''}
                      onChange={(e) =>
                        onCustomScriptChange({
                          meta: { ...DEFAULT_SCRIPT_META, ...customScript?.meta, author: e.target.value },
                          roles: customScript?.roles ?? [],
                        })
                      }
                      placeholder="Your name"
                      className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Roles in script (add from list)</label>
                  <div className="flex flex-wrap gap-2">
                    {(customScript?.roles ?? []).map((roleId, idx) => (
                      <span
                        key={`${roleId}-${idx}`}
                        className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs"
                      >
                        {rolesList.find((r) => r.id === roleId)?.name ?? roleId}
                        <button
                          type="button"
                          onClick={() =>
                            onCustomScriptChange({
                              meta: customScript?.meta ?? { ...DEFAULT_SCRIPT_META },
                              roles: (customScript?.roles ?? []).filter((_, i) => i !== idx),
                            })
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <select
                      value=""
                      onChange={(e) => {
                        const id = e.target.value
                        if (!id) return
                        onCustomScriptChange({
                          meta: customScript?.meta ?? { ...DEFAULT_SCRIPT_META },
                          roles: [...(customScript?.roles ?? []), id],
                        })
                        e.target.value = ''
                      }}
                      className="rounded border border-input bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">+ Add role</option>
                      {rolesList.filter((r) => r.id !== 'unknown').map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Custom role definitions (optional)</label>
                  <p className="mb-2 text-xs text-muted-foreground">Add homebrew roles so they appear in the role list above.</p>
                  <div className="space-y-2">
                    {(customRoles ?? []).map((r, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2 rounded border border-border bg-background p-2">
                        <input
                          type="text"
                          value={r.id}
                          onChange={(e) => {
                            const next = [...(customRoles ?? [])]
                            next[idx] = { ...next[idx], id: e.target.value }
                            onCustomRolesChange(next)
                          }}
                          placeholder="id (e.g. my_demon)"
                          className="w-28 rounded border border-input px-2 py-1 text-xs focus:border-primary focus:outline-none"
                        />
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => {
                            const next = [...(customRoles ?? [])]
                            next[idx] = { ...next[idx], name: e.target.value }
                            onCustomRolesChange(next)
                          }}
                          placeholder="Display name"
                          className="min-w-[100px] rounded border border-input px-2 py-1 text-xs focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => onCustomRolesChange((customRoles ?? []).filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onCustomRolesChange([
                          ...(customRoles ?? []),
                          {
                            id: '',
                            name: '',
                            edition: '',
                            team: 'townsfolk',
                            ability: '',
                            firstNightReminder: '',
                            otherNightReminder: '',
                            reminders: [],
                            setup: false,
                          },
                        ])
                      }
                      className="rounded border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      + Add custom role
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                customRoles={customRoles?.length ? customRoles : undefined}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
              ← Back
            </Button>
            {onSaveDraft && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onSaveDraft()}
                disabled={loading || saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            )}
            <Button
              type="button"
              onClick={async () => { await onSaveDraft?.(); onNext() }}
              disabled={loading || saving}
            >
              Save & Continue →
            </Button>
          </div>
        </div>
      )}

      {/* Bottom nav when nothing imported yet */}
      {!hasImported && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
            ← Back
          </Button>
        </div>
      )}
    </section>
  )
}
