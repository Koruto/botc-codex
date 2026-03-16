import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/Button'
import type { ExecutionEvent, GameEvent, GamePhase, Player } from '@/types'
import { PhaseType } from '@/types'
import type { DerivedGame } from '@/types'
import type { RoleOption } from '@/types'
import { defaultPregamePhase, emptyPhase, emptyGrimoireRevealPhase } from '@/utils/townSquareToGame'
import { phaseLabel } from '@/utils/phaseUtils'
import { X } from 'lucide-react'

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
      return { type: 'execution', playerId: firstPlayerId, prevented: false } as ExecutionEvent
    case 'private_room':
      return { type: 'private_room', players: [], highlights: '' }
    default:
      return { type: 'narrative', label: '', body: '' }
  }
}

const inputClass =
  'rounded border border-input bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20'

const phaseCardBaseClasses =
  'mb-6 rounded-lg border border-border bg-card p-5 shadow-sm transition-colors'

const phaseBadgeBaseClasses =
  'w-fit rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide'

const getPhaseCardClasses = (phase?: GamePhase): string => {
  switch (phase?.type) {
    case PhaseType.DAY:
      return `${phaseCardBaseClasses} border-l-4 border-l-events-phase-day`
    case PhaseType.NIGHT:
      return `${phaseCardBaseClasses} border-l-4 border-l-events-phase-night`
    case PhaseType.PREGAME:
    case PhaseType.GRIMOIRE_REVEAL:
    default:
      return `${phaseCardBaseClasses} border-l-4 border-l-primary`
  }
}

const getPhaseBadgeClasses = (phase?: GamePhase): string => {
  switch (phase?.type) {
    case PhaseType.DAY:
      return `${phaseBadgeBaseClasses} bg-events-phase-day/20 text-events-phase-day`
    case PhaseType.NIGHT:
      return `${phaseBadgeBaseClasses} bg-events-phase-night/20 text-events-phase-night`
    case PhaseType.PREGAME:
    case PhaseType.GRIMOIRE_REVEAL:
    default:
      return `${phaseBadgeBaseClasses} bg-primary/20 text-primary`
  }
}

/** Format role id (e.g. washerwoman, pit_hag) as display name (Washerwoman, Pit Hag). */
function formatRoleIdForDisplay(roleId: string): string {
  if (!roleId.trim()) return ''
  return roleId
    .trim()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}


function formatEventTypeDisplay(type: string): string {
  if (!type) return ''
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}



export function EventsPanel({
  players = [],
  rolesList = [],
  defaultPhases,
  saving,
  derivedGame,
  onBack,
  onSaveDraft,
  onSaveGame,
  onShowPreview,
}: EventsPanelProps) {
  const { control, register, watch, setValue, handleSubmit } = useForm<PhasesFormValues>({
    defaultValues: {
      phases: defaultPhases ?? [defaultPregamePhase(), emptyGrimoireRevealPhase()],
    },
  })

  const { fields: phaseFields, append: appendPhase, insert: insertPhase } = useFieldArray({
    control,
    name: 'phases',
  })

  const phases = watch('phases')

  const addPhase = () => {
    const last = phases[phases.length - 1]
    const isLastGrimoireReveal = last?.type === PhaseType.GRIMOIRE_REVEAL
    const countNightDay = phases.filter(
      (p) => p.type === PhaseType.NIGHT || p.type === PhaseType.DAY,
    ).length
    const nextNum = Math.ceil((countNightDay + 1) / 2)
    const nextType = (countNightDay + 1) % 2 === 1 ? 'night' : 'day'
    const newPhase: GamePhase = {
      ...emptyPhase(nextType, nextNum),
      events: [createDefaultEvent('narrative', players)],
    }
    if (isLastGrimoireReveal) {
      insertPhase(phases.length - 1, newPhase)
    } else {
      appendPhase(newPhase)
    }
  }

  const canDeletePhase = (phaseIndex: number): boolean => {
    if (phases.length <= 2) return false
    const lastDayNightIndex = [...phases]
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => p.type === PhaseType.DAY || p.type === PhaseType.NIGHT)
      .map(({ idx }) => idx)
      .pop()
    if (lastDayNightIndex === undefined) return false
    return phaseIndex === lastDayNightIndex
  }

  const deletePhaseAt = (phaseIndex: number) => {
    if (!canDeletePhase(phaseIndex)) return
    const next = phases.filter((_, idx) => idx !== phaseIndex)
    setValue('phases', next)
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
    const removed = new Set<number>([eventIndex])
    currentEvents.forEach((e, i) => {
      const chain = (e as GameEvent & { chainedToIndex?: number }).chainedToIndex
      if (chain !== undefined && chain === eventIndex) removed.add(i)
    })
    const removedArr = [...removed].sort((a, b) => a - b)
    const newEvents = currentEvents
      .filter((_, i) => !removed.has(i))
      .map((e) => {
        const chain = (e as GameEvent & { chainedToIndex?: number }).chainedToIndex
        if (chain == null) return e
        const newChain = chain - removedArr.filter((r) => r < chain).length
        return { ...e, chainedToIndex: newChain } as GameEvent
      })
    setValue(`phases.${phaseIndex}.events`, newEvents)
  }

  const handleSaveGame = handleSubmit((data) => onSaveGame(data.phases))

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-medium text-foreground">Events</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Add phases and events. Narrative and death events drive the story and grimoire state.
      </p>

      {phaseFields.map((field, phaseIndex) => {
        const phase = phases[phaseIndex]

        const showDelete = canDeletePhase(phaseIndex)
        return (
          <div
            key={field.id}
            className={getPhaseCardClasses(phase)}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <span className={getPhaseBadgeClasses(phase)}>
                  {phaseLabel(phase, phaseIndex)}
                </span>
                <input
                  {...register(`phases.${phaseIndex}.subtitle`)}
                  type="text"
                  className={`max-w-2xl text-sm text-muted-foreground placeholder:text-muted-foreground/70 ${inputClass}`}
                  placeholder="Subtitle"
                />
              </div>
              {showDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-4 mt-1 text-muted-foreground hover:text-red-500"
                  onClick={() => deletePhaseAt(phaseIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <ul className="space-y-2">
              {phase?.events.map((evt, eventIndex) => {
                const isChained = 'chainedToIndex' in evt && evt.chainedToIndex !== undefined
                return (
                  <li
                    key={eventIndex}
                    className={
                      isChained
                        ? 'rounded border border-border bg-muted/70 p-3 text-muted-foreground'
                        : 'rounded border border-border bg-muted/40 p-3'
                    }
                  >
                    <span className="text-xs font-medium text-primary">{formatEventTypeDisplay(evt.type)}</span>

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
                          disabled={'chainedToIndex' in evt && evt.chainedToIndex !== undefined}
                          className={
                            'chainedToIndex' in evt && evt.chainedToIndex !== undefined
                              ? `${inputClass} cursor-not-allowed opacity-70 bg-muted/60`
                              : inputClass
                          }
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
                          disabled={'chainedToIndex' in evt && evt.chainedToIndex !== undefined}
                          className={
                            'chainedToIndex' in evt && evt.chainedToIndex !== undefined
                              ? `${inputClass} cursor-not-allowed opacity-70 bg-muted/60`
                              : inputClass
                          }
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
                      <div className="mt-2 grid gap-2">
                        <div className="flex flex-wrap items-end gap-4 justify-between">
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Executed</span>
                            <select
                              value={evt.playerId}
                              onChange={(e) => {
                                const playerId = e.target.value
                                updateEvent(phaseIndex, eventIndex, { playerId })
                                const currentEvents = phases[phaseIndex]?.events ?? []
                                const next = currentEvents[eventIndex + 1]
                                if (
                                  next?.type === 'death' &&
                                  (next as GameEvent & { chainedToIndex?: number }).chainedToIndex === eventIndex
                                ) {
                                  updateEvent(phaseIndex, eventIndex + 1, { playerId } as Partial<GameEvent>)
                                }
                              }}
                              className={inputClass}
                            >
                              {players.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-foreground pb-1">
                            <input
                              type="checkbox"
                              checked={evt.prevented ?? false}
                              onChange={(e) => {
                                const prevented = e.target.checked
                                const currentEvents = phases[phaseIndex]?.events ?? []
                                const next = currentEvents[eventIndex + 1]
                                const nextIsChainedDeath =
                                  next?.type === 'death' &&
                                  (next as GameEvent & { chainedToIndex?: number }).chainedToIndex === eventIndex
                                if (prevented && nextIsChainedDeath) {
                                  const removed = eventIndex + 1
                                  let newEvents = currentEvents
                                    .filter((_, i) => i !== removed)
                                    .map((e) => {
                                      const chain = (e as GameEvent & { chainedToIndex?: number }).chainedToIndex
                                      if (chain != null && chain > removed)
                                        return { ...e, chainedToIndex: chain - 1 } as GameEvent
                                      return e
                                    })
                                  newEvents = newEvents.map((ev, i) =>
                                    i === eventIndex && ev.type === 'execution'
                                      ? { ...ev, prevented: true, reason: undefined }
                                      : ev,
                                  )
                                  setValue(`phases.${phaseIndex}.events`, newEvents)
                                } else if (!prevented && evt.playerId && !nextIsChainedDeath) {
                                  const death: GameEvent = {
                                    type: 'death',
                                    playerId: evt.playerId,
                                    cause: 'execution',
                                    chainedToIndex: eventIndex,
                                  }
                                  const newEvents = [
                                    ...currentEvents.slice(0, eventIndex),
                                    { ...currentEvents[eventIndex], prevented: false, reason: undefined },
                                    death,
                                    ...currentEvents.slice(eventIndex + 1),
                                  ]
                                  setValue(`phases.${phaseIndex}.events`, newEvents)
                                } else {
                                  updateEvent(phaseIndex, eventIndex, {
                                    prevented,
                                    ...(prevented ? {} : { reason: undefined }),
                                  })
                                }
                              }}
                              className="rounded border-border"
                            />
                            Prevented
                          </label>
                        </div>
                        {(evt.prevented ?? false) && (
                          <input
                            type="text"
                            value={evt.reason ?? ''}
                            onChange={(e) => updateEvent(phaseIndex, eventIndex, { reason: e.target.value })}
                            placeholder="Reason (e.g. Mayor bounced)"
                            className={inputClass}
                          />
                        )}
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
                              onChange={(e) => {
                                const passed = e.target.checked
                                const currentEvents = phases[phaseIndex]?.events ?? []
                                const nextEvt = currentEvents[eventIndex + 1]
                                const nextIsChainedExecution =
                                  nextEvt?.type === 'execution' &&
                                  (nextEvt as ExecutionEvent).chainedToIndex === eventIndex
                                if (passed && evt.nomineeId) {
                                  const execution: GameEvent = {
                                    type: 'execution',
                                    playerId: evt.nomineeId,
                                    prevented: false,
                                    chainedToIndex: eventIndex,
                                  } as ExecutionEvent
                                  if (nextIsChainedExecution) {
                                    updateEvent(phaseIndex, eventIndex + 1, {
                                      playerId: evt.nomineeId,
                                      prevented: false,
                                      chainedToIndex: eventIndex,
                                    })
                                    updateEvent(phaseIndex, eventIndex, { passed: true })
                                  } else {
                                    const death: GameEvent = {
                                      type: 'death',
                                      playerId: evt.nomineeId,
                                      cause: 'execution',
                                      chainedToIndex: eventIndex + 1,
                                    }
                                    const newEvents = [
                                      ...currentEvents.slice(0, eventIndex),
                                      { ...currentEvents[eventIndex], passed: true },
                                      execution,
                                      death,
                                      ...currentEvents.slice(eventIndex + 1),
                                    ]
                                    setValue(`phases.${phaseIndex}.events`, newEvents)
                                  }
                                } else {
                                  if (!passed && nextIsChainedExecution) {
                                    const removed = eventIndex + 1
                                    const newEvents = currentEvents
                                      .filter((_, i) => i !== removed)
                                      .map((e) => {
                                        const chain = (e as GameEvent & { chainedToIndex?: number }).chainedToIndex
                                        if (chain != null && chain > removed)
                                          return { ...e, chainedToIndex: chain - 1 } as GameEvent
                                        return e
                                      })
                                    const withNomination = newEvents.map((e, i) =>
                                      i === eventIndex && e.type === 'nomination' ? { ...e, passed: false } : e,
                                    )
                                    setValue(`phases.${phaseIndex}.events`, withNomination)
                                  } else {
                                    updateEvent(phaseIndex, eventIndex, { passed: false })
                                  }
                                }
                              }}
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
                );
              })}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              {EVENT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => addEvent(phaseIndex, value)}
                  className='rounded border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/60 hover:border-primary/60 focus:outline-none'
                >
                  + {label}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      <Button
        type="button"
        variant="secondary"
        onClick={addPhase}
        className="border border-dashed border-muted-foreground px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary mb-6"
      >
        + Add phase
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" onClick={onBack} disabled={saving}>
          ← Back
        </Button>
        {derivedGame && (
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={handleSubmit(async (data) => {
              await onSaveDraft(data.phases)
              onShowPreview()
            })}
          >
            Preview
          </Button>
        )}
        <Button type="button" onClick={handleSaveGame} disabled={saving}>
          {saving ? 'Saving…' : 'Save & Finish'}
        </Button>
      </div>
    </section>
  )
}
