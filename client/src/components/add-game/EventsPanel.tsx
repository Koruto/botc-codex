import { useForm, useFieldArray } from 'react-hook-form'
import type { GameEvent, GamePhase, Player } from '@/types'
import type { DerivedGame } from '@/types'
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
  players: Player[]
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
  'rounded border border-stone-600 bg-stone-800 px-2 py-1 text-sm text-stone-100 focus:border-amber-500 focus:outline-none'

export function EventsPanel({
  players,
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
    <section className="rounded-lg border border-stone-700 bg-stone-900/50 p-6">
      <h2 className="mb-4 text-lg font-medium text-stone-200">Events</h2>
      <p className="mb-4 text-sm text-stone-400">
        Add phases and events. Narrative and death events drive the story and grimoire state.
      </p>

      {phaseFields.map((field, phaseIndex) => {
        const phase = phases[phaseIndex]
        return (
          <div key={field.id} className="mb-6 rounded border border-stone-600 bg-stone-800/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <input
                {...register(`phases.${phaseIndex}.title`)}
                className={`flex-1 font-medium ${inputClass}`}
                placeholder="Phase title"
              />
              <input
                {...register(`phases.${phaseIndex}.subtitle`)}
                className={`flex-1 text-stone-400 ${inputClass}`}
                placeholder="Subtitle"
              />
            </div>

            <ul className="space-y-2">
              {phase?.events.map((evt, eventIndex) => (
                <li key={eventIndex} className="rounded border border-stone-700 bg-stone-900 p-3">
                  <span className="text-xs font-medium uppercase text-amber-500">{evt.type}</span>

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

                  {evt.type === 'ability' && (
                    <div className="mt-2 grid gap-2">
                      <select
                        value={evt.playerId}
                        onChange={(e) => updateEvent(phaseIndex, eventIndex, { playerId: e.target.value })}
                        className={inputClass}
                      >
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={evt.roleId}
                        onChange={(e) => updateEvent(phaseIndex, eventIndex, { roleId: e.target.value })}
                        placeholder="Role id"
                        className={`w-full ${inputClass}`}
                      />
                      <textarea
                        value={evt.result ?? ''}
                        onChange={(e) => updateEvent(phaseIndex, eventIndex, { result: e.target.value })}
                        placeholder="Result"
                        className={`min-h-[50px] w-full ${inputClass}`}
                      />
                    </div>
                  )}

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
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <select
                        value={evt.nominatorId}
                        onChange={(e) => updateEvent(phaseIndex, eventIndex, { nominatorId: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Nominator…</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <select
                        value={evt.nomineeId}
                        onChange={(e) => updateEvent(phaseIndex, eventIndex, { nomineeId: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Nominee…</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <label className="col-span-full flex items-center gap-2 text-sm text-stone-400">
                        <input
                          type="checkbox"
                          checked={evt.passed}
                          onChange={(e) => updateEvent(phaseIndex, eventIndex, { passed: e.target.checked })}
                          className="rounded border-stone-600"
                        />
                        Passed
                      </label>
                    </div>
                  )}

                  {evt.type === 'private_room' && (
                    <div className="mt-2 grid gap-2">
                      <div>
                        <span className="mb-1 block text-xs text-stone-500">Players in room</span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {players.map((p) => {
                            const checked = evt.players.includes(p.id)
                            return (
                              <label
                                key={p.id}
                                className="flex cursor-pointer items-center gap-1.5 text-sm text-stone-300"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const next = checked
                                      ? evt.players.filter((id) => id !== p.id)
                                      : [...evt.players, p.id]
                                    updateEvent(phaseIndex, eventIndex, { players: next })
                                  }}
                                  className="rounded border-stone-600"
                                />
                                {p.name}
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
                  )}

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
                  className="rounded border border-stone-600 px-2 py-1 text-xs text-stone-300 hover:bg-stone-700"
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
        className="mb-6 rounded border border-dashed border-stone-500 px-4 py-2 text-sm text-stone-400 hover:border-amber-500 hover:text-amber-400"
      >
        + Add phase
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-stone-600 px-4 py-2 text-sm text-stone-300 hover:bg-stone-800"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving}
          className="rounded border border-amber-600 px-4 py-2 text-sm text-amber-400 hover:bg-amber-600/20 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={handleSaveGame}
          disabled={saving}
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-500 disabled:opacity-50"
        >
          Save game
        </button>
        {derivedGame && (
          <button
            type="button"
            onClick={onShowPreview}
            className="rounded border border-amber-500 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10"
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
