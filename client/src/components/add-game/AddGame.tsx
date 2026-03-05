import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { GamePhase, GameUpdateBody } from '@/types'
import type { TownSquareGameState } from '@/types/townSquare.types'
import { defaultPregamePhase, townSquareToGame } from '@/utils/townSquareToGame'
import { deriveGame } from '@/utils/deriveGame'
import { getRolesList } from '@/utils/roles'
import { GameView } from '@/components/GameView'
import { ImportPanel } from './ImportPanel'
import { MetaPanel } from './MetaPanel'
import type { MetaFormValues } from './MetaPanel'
import { EventsPanel } from './EventsPanel'

const rolesList = getRolesList()

const STEPS = ['Import', 'Meta', 'Events'] as const
type StepIndex = 0 | 1 | 2

export function AddGame() {
  const { serverId } = useParams<{ serverId: string }>()
  const navigate = useNavigate()

  const [step, setStep] = useState<StepIndex>(0)
  const [showPreview, setShowPreview] = useState(false)

  const [townSquare, setTownSquare] = useState<TownSquareGameState | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)

  const [metaFormValues, setMetaFormValues] = useState<MetaFormValues>({
    gameName: '',
    title: '',
    subtitle: '',
    playedOn: '',
    edition: '',
    playerCount: 0,
    storyteller: '',
  })
  const [committedPhases, setCommittedPhases] = useState<GamePhase[]>([defaultPregamePhase()])

  // Key to force-remount panels when draft is resumed
  const [formResetToken, setFormResetToken] = useState(0)

  // API/save state
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [loadingImport, setLoadingImport] = useState(false)
  const [draftOffer, setDraftOffer] = useState<{ gameId: string; updatedAt: string } | null>(null)

  const game = townSquare
    ? townSquareToGame(townSquare, {
      gameId: draftId ?? 'draft',
      title: metaFormValues.title || 'Preview',
      subtitle: metaFormValues.subtitle || undefined,
      meta: {
        playedOn: metaFormValues.playedOn,
        edition: metaFormValues.edition,
        playerCount: metaFormValues.playerCount,
        storyteller: metaFormValues.storyteller,
      },
      phases: committedPhases.length > 0 ? committedPhases : undefined,
    })
    : null
  const derivedGame = game ? deriveGame(game) : null

  // When townSquare is first loaded, seed playerCount and edition defaults
  useEffect(() => {
    if (townSquare && metaFormValues.playerCount === 0) {
      setMetaFormValues((prev) => ({
        ...prev,
        playerCount: townSquare.players.length,
        edition: (townSquare.edition?.id as string) || prev.edition,
      }))
    }
  }, [townSquare])

  // Check for existing draft on mount
  useEffect(() => {
    if (!serverId) return
    api
      .listGames(serverId, 'draft')
      .then((list) => {
        const latest = list[0]
        if (latest && !draftId) setDraftOffer({ gameId: latest.gameId, updatedAt: latest.updatedAt })
      })
      .catch(() => { })
  }, [serverId, draftId])

  const saveDraft = useCallback(
    async (payload: GameUpdateBody) => {
      if (!serverId) return
      setSaving(true)
      setSaveStatus('saving')
      try {
        if (draftId) {
          await api.updateGame(serverId, draftId, payload)
        } else {
          const created = await api.createGame(serverId, payload)
          setDraftId(created.gameId)
        }
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      } finally {
        setSaving(false)
      }
    },
    [serverId, draftId],
  )

  const resumeDraft = useCallback(async () => {
    if (!serverId || !draftOffer) return
    const doc = await api.getGame(serverId, draftOffer.gameId)
    setDraftId(doc.gameId)
    if (doc.townSquare) setTownSquare(doc.townSquare)
    if (doc.phases && Array.isArray(doc.phases) && doc.phases.length > 0) {
      setCommittedPhases(doc.phases)
    }
    setMetaFormValues({
      gameName: doc.name ?? '',
      title: doc.title ?? '',
      subtitle: doc.subtitle ?? '',
      playedOn: doc.meta?.playedOn ?? '',
      edition: doc.meta?.edition ?? '',
      playerCount: doc.meta?.playerCount ?? 0,
      storyteller: doc.meta?.storyteller ?? '',
    })
    setFormResetToken((t) => t + 1)
    setDraftOffer(null)
  }, [serverId, draftOffer])

  // ImportPanel callbacks
  const handleFileUpload = async (file: File) => {
    if (!serverId) return
    setLoadingImport(true)
    try {
      const res = await api.processGrimoire(file)
      setTownSquare(res.townSquare)
      await saveDraft({ townSquare: res.townSquare })
    } finally {
      setLoadingImport(false)
    }
  }

  const handlePasteSubmit = async (json: string) => {
    if (!serverId) return
    setLoadingImport(true)
    try {
      const res = await api.fromJson(JSON.parse(json) as Record<string, unknown>)
      setTownSquare(res.townSquare)
      if (res.meta) {
        setMetaFormValues((prev) => ({ ...prev, ...res.meta }))
      }
      await saveDraft({ townSquare: res.townSquare })
    } finally {
      setLoadingImport(false)
    }
  }

  const handleReplaceWithPaste = async (json: string) => {
    if (!serverId || !draftId) return
    setLoadingImport(true)
    try {
      const res = await api.fromJson(JSON.parse(json) as Record<string, unknown>)
      setTownSquare(res.townSquare)
      if (res.meta) {
        setMetaFormValues((prev) => ({ ...prev, ...res.meta }))
      }
      await api.updateGame(serverId, draftId, { townSquare: res.townSquare })
      setSaveStatus('saved')
    } finally {
      setLoadingImport(false)
    }
  }

  // MetaPanel callbacks
  const saveMetaPayload = (data: MetaFormValues) => ({
    name: data.gameName || undefined,
    title: data.title || undefined,
    subtitle: data.subtitle || undefined,
    meta: {
      playedOn: data.playedOn,
      edition: data.edition,
      playerCount: data.playerCount,
      storyteller: data.storyteller,
    },
  })

  const handleSaveMeta = async (data: MetaFormValues) => {
    setMetaFormValues(data)
    await saveDraft(saveMetaPayload(data))
    setStep(2)
  }

  const handleSaveMetaOnly = async (data: MetaFormValues) => {
    setMetaFormValues(data)
    await saveDraft(saveMetaPayload(data))
  }

  // EventsPanel callbacks
  const handleSavePhaseDraft = async (phases: GamePhase[]) => {
    setCommittedPhases(phases)
    await saveDraft({ phases })
  }

  const handlePublishGame = async (phases: GamePhase[]) => {
    if (!serverId || !draftId) return
    setSaving(true)
    try {
      await api.updateGame(serverId, draftId, { status: 'published', phases })
      navigate(`/game/${draftId}`)
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const goBack = () => {
    if (step > 0) setStep((s) => (s - 1) as StepIndex)
  }

  if (showPreview && derivedGame) {
    return (
      <div className="relative min-h-screen">
        <GameView game={derivedGame} gameId={draftId ?? undefined} />
        <div className="fixed right-4 top-4 z-1001 flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="rounded bg-stone-800/95 px-4 py-2 text-sm font-medium text-stone-100 shadow-lg ring-1 ring-stone-600 hover:bg-stone-700 backdrop-blur-sm"
          >
            ← Back to editing
          </button>
          <Link
            to={`/server/${serverId}`}
            className="rounded border border-stone-600 bg-stone-800/95 px-4 py-2 text-sm text-stone-300 hover:bg-stone-700 backdrop-blur-sm"
          >
            Back to server
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <Link to={`/server/${serverId}`} className="text-sm text-amber-400 hover:underline">
            ← Back to server
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-amber-500">Add game</h1>
          <p className="text-stone-400">
            Step {step + 1}: {STEPS[step]} — Upload a grimoire image or paste Town Square JSON, then add meta and
            events.
          </p>
          {draftOffer && (
            <div className="mt-3 flex items-center gap-3 rounded border border-amber-600/50 bg-amber-950/30 px-3 py-2 text-sm">
              <span className="text-amber-200">You have an existing draft.</span>
              <button
                type="button"
                onClick={resumeDraft}
                className="rounded bg-amber-600 px-3 py-1 font-medium text-stone-900 hover:bg-amber-500"
              >
                Resume draft
              </button>
              <button
                type="button"
                onClick={() => setDraftOffer(null)}
                className="text-stone-400 hover:text-stone-200"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Stepper */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i as StepIndex)}
              className={`rounded px-3 py-1.5 text-sm font-medium ${step === i ? 'bg-amber-600 text-stone-900' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {step === 0 && (
          <ImportPanel
            townSquare={townSquare}
            saveStatus={saveStatus}
            loading={loadingImport}
            rolesList={rolesList}
            derivedGame={derivedGame}
            onFileUpload={handleFileUpload}
            onPasteSubmit={handlePasteSubmit}
            onReplaceWithPaste={handleReplaceWithPaste}
            onUpdateTownSquare={setTownSquare}
            onNext={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <MetaPanel
            key={formResetToken}
            defaultValues={metaFormValues}
            saving={saving}
            saveStatus={saveStatus}
            derivedGame={derivedGame}
            onBack={goBack}
            onSave={handleSaveMetaOnly}
            onSaveAndNext={handleSaveMeta}
            onShowPreview={() => setShowPreview(true)}
          />
        )}

        {step === 2 && (
          <EventsPanel
            key={formResetToken}
            players={game?.players ?? []}
            defaultPhases={committedPhases}
            saving={saving}
            saveStatus={saveStatus}
            derivedGame={derivedGame}
            onBack={goBack}
            onSaveDraft={handleSavePhaseDraft}
            onSaveGame={handlePublishGame}
            onShowPreview={() => setShowPreview(true)}
          />
        )}
      </div>
    </div>
  )
}
