import { useForm, useFieldArray } from 'react-hook-form'
import type { GameEvent, GamePhase, Player } from '@/types'
import type { DerivedGame } from '@/types'
import type { RoleOption } from '@/types'
import { defaultPregamePhase, emptyPhase } from '@/utils/townSquareToGame'

const EVENT_TYPES = [
  { value: 'narrative', label: 'Narrative' },
  { value: 'death', label: 'Death' },
  { value: 'ability', label: 'Ability' },
  { value: 'nomination', label: 'Nomination' },
  { value: 'execution', label: 'Execution' },
  { value: 'private_room', label: 'Private room' },
] as const

type PhasesFormValues = {
  phases: GamePhase[]
}

export type EventsPanelProps = {
  players?: Player[]
  rolesList?: RoleOption[]
  defaultPhases?: GamePhase[]
  saving: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  derivedGame: DerivedGame | null
  onBack: () => void
  onSaveDraft: (phases: GamePhase[]) => void | Promise<void>
  onSaveGame: (phases: GamePhase[]) => void | Promise<void>
  onShowPreview: () => void
}

function createDefaultEvent(eventType: string, players: Player[]): GameEvent {
  const firstPlayerId = players[0]?.id ?? ''
  switch (eventType) {
    case 'narrative':
      return { type: 'narrative', label: '', body: '' }
    case 'death':
      return { type: 'death', playerId: firstPlayerId, cause: 'night_kill' }
    case 'ability':
      return { type: 'ability', playerId: firstPlayerId, roleId: '', isPublic: false }
    case 'nomination':
      return { type: 'nomination', nominatorId: '', nomineeId: '', votesFor: [], votesAgainst: [], passed: false }
    case 'execution':
      return { type: 'execution', playerId: firstPlayerId }
    case 'private_room':
      return { type: 'private_room', players: [], highlights: '' }
    default:
      return { type: 'narrative', label: '', body: '' }
  }
}

const inputClass =
  'rounded border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20'

/** Format role id (e.g. washerwoman, pit_hag) as display name (Washerwoman, Pit Hag). */
function formatRoleIdForDisplay(roleId: string): string {
  if (!roleId.trim()) return ''
  return roleId
    .trim()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function EventsPanel({
  players = [],
  rolesList = [],
  defaultPhases,
  saving,
  saveStatus,
  derivedGame,
  onBack,
  onSaveDraft,
  onSaveGame,
  onShowPreview,
}: EventsPanelProps) {
  const { control, register, watch, setValue, handleSubmit } = useForm<PhasesFormValues>({
    defaultValues: { phases: defaultPhases ?? [defaultPregamePhase()] },
  })

  const { fields: phaseFields, append: appendPhase } = useFieldArray({
    control,
    name: 'phases',
  })

  const phases = watch('phases')

  const addPhase = () => {
    const n = phaseFields.length
    const nextNum = Math.ceil(n / 2)
    const nextType = n % 2 === 1 ? 'night' : 'day'
    appendPhase(emptyPhase(nextType, nextNum))
  }

  const addEvent = (phaseIndex: number, eventType: string) => {
    const currentEvents = phases[phaseIndex]?.events ?? []
    setValue(`phases.${phaseIndex}.events`, [...currentEvents, createDefaultEvent(eventType, players)])
  }

  const updateEvent = (phaseIndex: number, eventIndex: number, upd: Partial<GameEvent>) => {
    const currentEvents = phases[phaseIndex]?.events ?? []
    setValue(
      `phases.${phaseIndex}.events`,
      currentEvents.map((e, j) => (j === eventIndex ? ({ ...e, ...upd } as GameEvent) : e)),
    )
  }

  const removeEvent = (phaseIndex: number, eventIndex: number) => {
    const currentEvents = phases[phaseIndex]?.events ?? []
    setValue(
      `phases.${phaseIndex}.events`,
      currentEvents.filter((_, j) => j !== eventIndex),
    )
  }

  const handleSaveDraft = handleSubmit((data) => onSaveDraft(data.phases))
  const handleSaveGame = handleSubmit((data) => onSaveGame(data.phases))

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-medium text-foreground">Events</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Add phases and events. Narrative and death events drive the story and grimoire state.
      </p>

      {phaseFields.map((field, phaseIndex) => {
        const phase = phases[phaseIndex]
        return (
          <div key={field.id} className="mb-6 rounded border border-border bg-muted/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <input
                {...register(`phases.${phaseIndex}.title`)}
                className={`flex-1 font-medium ${inputClass}`}
                placeholder="Phase title"
              />
              <input
                {...register(`phases.${phaseIndex}.subtitle`)}
                className={`flex-1 text-muted-foreground ${inputClass}`}
                placeholder="Subtitle"
              />
            </div>

            <ul className="space-y-2">
              {phase?.events.map((evt, eventIndex) => (
                <li key={eventIndex} className="rounded border border-border bg-card p-3">
                  <span className="text-xs font-medium uppercase text-primary">{evt.type}</span>

                  {evt.type === 'narrative' && (
                    <div className="mt-2 grid gap-2">
                      <input
                        type="text"
                        value={evt.label}
                        onChange={(e) => updateEvent(phaseIndex, eventIndex, { label: e.target.value })}
                        placeholder="Label"
                        className={`w-full ${inputClass}`}
                      />
                      <textarea
                        value={evt.body}
                        onChange={(e) => updateEvent(phaseIndex, eventIndex, { body: e.target.value })}
                        placeholder="Body"
                        className={`min-h-[60px] w-full ${inputClass}`}
                        rows={2}
                      />
                    </div>
                  )}

                  {evt.type === 'death' && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <select
                        value={evt.playerId}
                        onChange={(e) => updateEvent(phaseIndex, eventIndex, { playerId: e.target.value })}
                        className={inputClass}
                      >
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <select
                        value={evt.cause}
                        onChange={(e) =>
                          updateEvent(phaseIndex, eventIndex, {
                            cause: e.target.value as 'night_kill' | 'ability' | 'execution' | 'other',
                          })
                        }
                        className={inputClass}
                      >
                        <option value="night_kill">Night kill</option>
                        <option value="ability">Ability</option>
                        <option value="execution">Execution</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}

                  {evt.type === 'ability' && (() => {
                    const abilityPlayer = players.find((p) => p.id === evt.playerId)
                    const roleId = abilityPlayer?.roleId ?? evt.roleId
                    const roleName =
                      ((rolesList ?? []).find((r) => r.id === roleId)?.name ??
                        (roleId ? formatRoleIdForDisplay(roleId) : '')) || '—'
                    return (
                      <div className="mt-2 grid gap-2">
                        <select
                          value={evt.playerId}
                          onChange={(e) => {
                            const newPlayerId = e.target.value
                            const newPlayer = players.find((p) => p.id === newPlayerId)
                            updateEvent(phaseIndex, eventIndex, {
                              playerId: newPlayerId,
                              roleId: newPlayer?.roleId ?? '',
                            })
                          }}
                          className={inputClass}
                        >
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Role (from step 1)</span>
                          <div
                            className="min-h-9 rounded border border-border bg-muted/60 px-2 py-1.5 text-sm text-foreground"
                            aria-readonly
                          >
                            {roleName}
                          </div>
                        </div>
                        <textarea
                          value={evt.result ?? ''}
                          onChange={(e) => updateEvent(phaseIndex, eventIndex, { result: e.target.value })}
                          placeholder="Result"
                          className={`min-h-[50px] w-full ${inputClass}`}
                        />
                      </div>
                    )
                  })()}

                  {evt.type === 'execution' && (
                    <div className="mt-2">
                      <select
                        value={evt.playerId}
                        onChange={(e) => updateEvent(phaseIndex, eventIndex, { playerId: e.target.value })}
                        className={inputClass}
                      >
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {evt.type === 'nomination' && (
                    <div className="mt-2 grid gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={evt.nominatorId}
                          onChange={(e) => updateEvent(phaseIndex, eventIndex, { nominatorId: e.target.value })}
                          className={inputClass}
                        >
                          <option value="">Select player…</option>
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <span className="text-sm text-muted-foreground">nominates</span>
                        <select
                          value={evt.nomineeId}
                          onChange={(e) => updateEvent(phaseIndex, eventIndex, { nomineeId: e.target.value })}
                          className={inputClass}
                        >
                          <option value="">this player…</option>
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Who voted for (to execute)</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {players.map((p) => {
                            const voted = evt.votesFor.includes(p.id)
                            return (
                              <label
                                key={p.id}
                                className="flex cursor-pointer items-center gap-1.5 text-sm text-foreground"
                              >
                                <input
                                  type="checkbox"
                                  checked={voted}
                                  onChange={() => {
                                    const next = voted
                                      ? evt.votesFor.filter((id) => id !== p.id)
                                      : [...evt.votesFor, p.id]
                                    updateEvent(phaseIndex, eventIndex, { votesFor: next })
                                  }}
                                  className="rounded border-border"
                                />
                                {p.name}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Outcome</span>
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={evt.passed}
                            onChange={(e) => updateEvent(phaseIndex, eventIndex, { passed: e.target.checked })}
                            className="rounded border-border"
                          />
                          Vote passed (nominee executed)
                        </label>
                      </div>
                    </div>
                  )}

                  {evt.type === 'private_room' && (() => {
                    const creatorId = evt.players[0] ?? ''
                    const participantIds = evt.players
                    const setCreator = (newCreatorId: string) => {
                      if (!newCreatorId) {
                        updateEvent(phaseIndex, eventIndex, { players: evt.players.filter((id) => id !== creatorId) })
                        return
                      }
                      const rest = evt.players.filter((id) => id !== newCreatorId)
                      updateEvent(phaseIndex, eventIndex, { players: [newCreatorId, ...rest] })
                    }
                    const toggleParticipant = (playerId: string) => {
                      const inRoom = evt.players.includes(playerId)
                      const next = inRoom
                        ? evt.players.filter((id) => id !== playerId)
                        : [...evt.players, playerId]
                      updateEvent(phaseIndex, eventIndex, { players: next })
                    }
                    return (
                      <div className="mt-2 grid gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Created by</span>
                          <select
                            value={creatorId}
                            onChange={(e) => setCreator(e.target.value)}
                            className={inputClass}
                          >
                            <option value="">Select who created the room…</option>
                            {players.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">Who was in the room</span>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {players.map((p) => {
                              const checked = participantIds.includes(p.id)
                              const isCreator = p.id === creatorId
                              return (
                                <label
                                  key={p.id}
                                  className={`flex items-center gap-1.5 text-sm text-foreground ${isCreator ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={isCreator}
                                    onChange={() => !isCreator && toggleParticipant(p.id)}
                                    className="rounded border-border disabled:opacity-70"
                                  />
                                  {p.name}
                                  {isCreator && <span className="text-xs text-muted-foreground">(creator)</span>}
                                </label>
                              )
                            })}
                          </div>
                        </div>
                        <textarea
                          value={evt.highlights}
                          onChange={(e) => updateEvent(phaseIndex, eventIndex, { highlights: e.target.value })}
                          placeholder="Highlights of what was discussed"
                          className={`min-h-[60px] w-full ${inputClass}`}
                          rows={2}
                        />
                      </div>
                    )
                  })()}

                  <button
                    type="button"
                    onClick={() => removeEvent(phaseIndex, eventIndex)}
                    className="mt-2 text-xs text-red-400 hover:underline"
                  >
                    Remove event
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex flex-wrap gap-2">
              {EVENT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => addEvent(phaseIndex, value)}
                  className="rounded border-2 border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  + {label}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={addPhase}
        className="mb-6 rounded border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
      >
        + Add phase
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-input px-4 py-2 text-sm text-foreground hover:bg-muted"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving}
          className="rounded border border-primary px-4 py-2 text-sm text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={handleSaveGame}
          disabled={saving}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Save game
        </button>
        {derivedGame && (
          <button
            type="button"
            onClick={handleSubmit(async (data) => {
              await onSaveDraft(data.phases)
              onShowPreview()
            })}
            className="rounded border border-primary px-4 py-2 text-sm text-primary hover:bg-primary/10"
          >
            Preview full page
          </button>
        )}
        {saveStatus === 'saved' && <span className="text-sm text-green-400">Draft saved</span>}
        {saveStatus === 'error' && <span className="text-sm text-red-400">Save failed</span>}
      </div>
    </section>
  )
}
