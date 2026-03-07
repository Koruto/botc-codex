import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { EditionId, GamePhase, GameUpdateBody } from '@/types'
import type { TownSquareGameState } from '@/types/townSquare.types'
import type { MyServerItem } from '@/types/api.types'
import { defaultPregamePhase, emptyGrimoireRevealPhase, townSquareToGame } from '@/utils/townSquareToGame'
import { PhaseType } from '@/types'
import { deriveGame } from '@/utils/deriveGame'
import { getRolesList } from '@/utils/roles'
import { GameView } from '@/components/GameView'
import { Button } from '@/components/Button'
import { ImportPanel } from './ImportPanel'
import { MetaPanel } from './MetaPanel'
import type { MetaFormValues } from './MetaPanel'
import { EventsPanel } from './EventsPanel'

const rolesList = getRolesList()

const STEPS = ['Import', 'Meta', 'Events'] as const
type StepIndex = 0 | 1 | 2

export function AddGame() {
  const { serverId: urlServerId } = useParams<{ serverId: string }>()
  const navigate = useNavigate()

  // Server selection — comes from URL or user picks inline
  const [selectedServerId, setSelectedServerId] = useState<string>(urlServerId ?? '')
  const [myServers, setMyServers] = useState<MyServerItem[]>([])
  const [serversLoading, setServersLoading] = useState(!urlServerId)
  const [newServerName, setNewServerName] = useState('')
  const [creatingServer, setCreatingServer] = useState(false)
  const [createServerError, setCreateServerError] = useState<string | null>(null)
  const [noServerError, setNoServerError] = useState(false)

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
  const [committedPhases, setCommittedPhases] = useState<GamePhase[]>([
    defaultPregamePhase(),
    emptyGrimoireRevealPhase(),
  ])

  const [formResetToken, setFormResetToken] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [loadingImport, setLoadingImport] = useState(false)
  const [draftOffer, setDraftOffer] = useState<{ gameId: string; updatedAt: string } | null>(null)

  // Load user's servers when coming from dashboard (no URL serverId)
  useEffect(() => {
    if (urlServerId) return
    api
      .myServers()
      .then((res) => {
        setMyServers(res.items)
        if (res.items.length === 1) setSelectedServerId(res.items[0].serverId)
      })
      .catch(() => {})
      .finally(() => setServersLoading(false))
  }, [urlServerId])

  // Check for existing draft only when coming from a specific server
  useEffect(() => {
    if (!urlServerId) return
    api
      .listGames(urlServerId, 0, 1)
      .then((res) => {
        const latest = res.items[0]
        if (latest && !draftId) setDraftOffer({ gameId: latest.gameId, updatedAt: latest.updatedAt })
      })
      .catch(() => {})
  }, [urlServerId, draftId])

  const game = townSquare
    ? townSquareToGame(townSquare, {
        gameId: draftId ?? 'draft',
        title: metaFormValues.title || 'Preview',
        subtitle: metaFormValues.subtitle || undefined,
        meta: {
          playedOn: metaFormValues.playedOn,
          edition: metaFormValues.edition as EditionId,
          playerCount: metaFormValues.playerCount,
          storyteller: metaFormValues.storyteller,
        },
        phases: committedPhases.length > 0 ? committedPhases : undefined,
      })
    : null
  const derivedGame = game ? deriveGame(game) : null

  useEffect(() => {
    if (townSquare && metaFormValues.playerCount === 0) {
      setMetaFormValues((prev) => ({
        ...prev,
        playerCount: townSquare.players.length,
        edition: (townSquare.edition?.id as string) || prev.edition as string,
      }))
    }
  }, [townSquare])

  const handleCreateServer = async () => {
    const name = newServerName.trim()
    if (!name) return
    setCreatingServer(true)
    setCreateServerError(null)
    try {
      const server = await api.createServer(name)
      const item: MyServerItem = { ...server, isCreator: true, isMember: true, joinedAt: server.createdAt }
      setMyServers((prev) => [...prev, item])
      setSelectedServerId(server.serverId)
      setNewServerName('')
      setNoServerError(false)
    } catch (err) {
      setCreateServerError(err instanceof Error ? err.message : 'Failed to create server')
    } finally {
      setCreatingServer(false)
    }
  }

  const saveDraft = useCallback(
    async (payload: GameUpdateBody) => {
      if (!selectedServerId) return  // silently skip — data held in local state
      setSaving(true)
      setSaveStatus('saving')
      try {
        if (draftId) {
          await api.updateGame(selectedServerId, draftId, payload)
        } else {
          const created = await api.createGame(selectedServerId, payload)
          setDraftId(created.gameId)
        }
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      } finally {
        setSaving(false)
      }
    },
    [selectedServerId, draftId],
  )

  const resumeDraft = useCallback(async () => {
    if (!urlServerId || !draftOffer) return
    const doc = await api.getGame(urlServerId, draftOffer.gameId)
    setDraftId(doc.gameId)
    if (doc.townSquare) setTownSquare(doc.townSquare)
    if (doc.phases && Array.isArray(doc.phases) && doc.phases.length > 0) {
      const phases = doc.phases as GamePhase[]
      const last = phases[phases.length - 1]
      setCommittedPhases(
        last?.type === PhaseType.GRIMOIRE_REVEAL ? phases : [...phases, emptyGrimoireRevealPhase()],
      )
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
  }, [urlServerId, draftOffer])

  const handleFileUpload = async (file: File) => {
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
    setLoadingImport(true)
    try {
      const res = await api.fromJson(JSON.parse(json) as Record<string, unknown>)
      setTownSquare(res.townSquare)
      if (res.meta) setMetaFormValues((prev) => ({ ...prev, ...res.meta }))
      await saveDraft({ townSquare: res.townSquare })
    } finally {
      setLoadingImport(false)
    }
  }

  const handleReplaceWithPaste = async (json: string) => {
    if (!selectedServerId || !draftId) return
    setLoadingImport(true)
    try {
      const res = await api.fromJson(JSON.parse(json) as Record<string, unknown>)
      setTownSquare(res.townSquare)
      if (res.meta) setMetaFormValues((prev) => ({ ...prev, ...res.meta }))
      await api.updateGame(selectedServerId, draftId, { townSquare: res.townSquare })
      setSaveStatus('saved')
    } finally {
      setLoadingImport(false)
    }
  }

  const saveMetaPayload = (data: MetaFormValues) => ({
    name: data.gameName || undefined,
    title: data.title || undefined,
    subtitle: data.subtitle || undefined,
    meta: {
      playedOn: data.playedOn,
      edition: data.edition as EditionId,
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

  const handleSavePhaseDraft = async (phases: GamePhase[]) => {
    setCommittedPhases(phases)
    await saveDraft({ phases })
  }

  const handlePublishGame = async (phases: GamePhase[]) => {
    if (!selectedServerId) {
      setNoServerError(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSaving(true)
    setNoServerError(false)
    try {
      if (draftId) {
        await api.updateGame(selectedServerId, draftId, { phases })
        navigate(`/game/${draftId}`)
      } else {
        // No draft saved yet (e.g. user skipped import) — create fresh
        const created = await api.createGame(selectedServerId, {
          ...saveMetaPayload(metaFormValues),
          townSquare: townSquare ?? undefined,
          phases,
        })
        navigate(`/game/${created.gameId}`)
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const goBack = () => {
    if (step > 0) setStep((s) => (s - 1) as StepIndex)
  }

  const backLink = selectedServerId ? `/servers/${selectedServerId}` : '/dashboard'
  const backLabel = selectedServerId
    ? `← ${myServers.find((s) => s.serverId === selectedServerId)?.name ?? 'Back to server'}`
    : '← Back to dashboard'

  if (showPreview && derivedGame) {
    return (
      <div className="relative min-h-screen">
        <GameView game={derivedGame} gameId={draftId ?? undefined} />
        <div className="fixed right-4 top-4 z-1001 flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="rounded bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg ring-1 ring-border hover:bg-muted backdrop-blur-sm"
          >
            ← Back to editing
          </button>
          <Link
            to={backLink}
            className="rounded border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted backdrop-blur-sm"
          >
            {selectedServerId ? 'Back to server' : 'Back to dashboard'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <Link to={backLink} className="text-sm text-primary hover:underline">
            {backLabel}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-primary">Add game</h1>
          <p className="text-muted-foreground">
            Step {step + 1}: {STEPS[step]} — Upload a grimoire image or paste Town Square JSON, then
            add meta and events.
          </p>

          {/* Draft offer */}
          {draftOffer && (
            <div className="mt-3 flex items-center gap-3 rounded border border-primary/50 bg-primary/10 px-3 py-2 text-sm">
              <span className="text-primary">You have an existing draft.</span>
              <button
                type="button"
                onClick={resumeDraft}
                className="rounded bg-primary px-3 py-1 font-medium text-primary-foreground hover:bg-primary/90"
              >
                Resume draft
              </button>
              <button
                type="button"
                onClick={() => setDraftOffer(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Server picker — shown when not coming from a specific server URL */}
        {!urlServerId && (
          <div
            className={`mb-6 rounded-lg border p-4 ${
              noServerError ? 'border-destructive bg-destructive/5' : 'border-border bg-card'
            }`}
          >
            <p className="mb-3 text-sm font-medium text-foreground">
              Save to server{' '}
              <span className="font-normal text-muted-foreground">
                (optional — helps group games with your play group)
              </span>
            </p>
            {noServerError && (
              <p className="mb-2 text-sm text-destructive">
                Select or create a server to save this game.
              </p>
            )}
            {serversLoading ? (
              <p className="text-sm text-muted-foreground">Loading your servers…</p>
            ) : (
              <div className="flex flex-col gap-3">
                {myServers.length > 0 && (
                  <select
                    value={selectedServerId}
                    onChange={(e) => { setSelectedServerId(e.target.value); setNoServerError(false) }}
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">No server (personal only)</option>
                    {myServers.map((s) => (
                      <option key={s.serverId} value={s.serverId}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateServer() } }}
                    placeholder={myServers.length > 0 ? 'Or create a new server…' : 'Create a server (e.g. "Tuesday group")'}
                    maxLength={100}
                    className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleCreateServer}
                    disabled={creatingServer || !newServerName.trim()}
                  >
                    {creatingServer ? 'Creating…' : 'Create'}
                  </Button>
                </div>
                {createServerError && (
                  <p className="text-sm text-destructive">{createServerError}</p>
                )}
                {selectedServerId && (
                  <p className="text-xs text-muted-foreground">
                    Saving to:{' '}
                    <span className="font-medium text-foreground">
                      {myServers.find((s) => s.serverId === selectedServerId)?.name}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stepper */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i as StepIndex)}
              className={`rounded border px-3 py-1.5 text-sm font-medium transition-colors ${
                step === i
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground hover:bg-muted/60'
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
            rolesList={rolesList}
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
