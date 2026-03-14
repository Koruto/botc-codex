import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { createServer, getServers, getServerBySlug } from '@/api/servers'
import { createGame, getServerGame, getServerGameBySlug, updateGame } from '@/api/games'
import { parseGrimoireJson, processGrimoire } from '@/api/grimoire'
import type { EditionId, GamePhase, GameUpdateBody } from '@/types'
import type { TownSquareGameState } from '@/types/townSquare.types'
import type { MyServerItem } from '@/types/api.types'
import type { CustomScript, RoleInfo } from '@/types/grimoire.types'
import { defaultPregamePhase, emptyGrimoireRevealPhase, townSquareToGame } from '@/utils/townSquareToGame'
import { PhaseType } from '@/types'
import { deriveGame } from '@/utils/deriveGame'
import { getRolesList, getRolesListByEdition, getBluffsRoleOptions, UNKNOWN_ROLE_OPTION } from '@/utils/roles'
import { GameView } from '@/components/GameView'
import { Button } from '@/components/Button'
import { ImportGameJsonPanel } from './ImportGameJsonPanel'
import { ImportPanel } from './ImportPanel'
import { MetaPanel } from './MetaPanel'
import type { MetaFormValues } from './MetaPanel'
import { EventsPanel } from './EventsPanel'

const STEPS = ['Import game JSON', 'Meta', 'Import', 'Events'] as const
type StepIndex = 0 | 1 | 2 | 3

export function AddGame() {
  const { serverSlug: urlServerSlug, gameSlug: urlGameSlug } = useParams<{ serverSlug?: string; gameSlug?: string }>()
  const [searchParams] = useSearchParams()
  const editGameId = searchParams.get('edit')
  const navigate = useNavigate()

  const [resolvedServerId, setResolvedServerId] = useState<string | null>(null)
  const [selectedServerId, setSelectedServerId] = useState<string>('')
  const [myServers, setMyServers] = useState<MyServerItem[]>([])
  const [serversLoading, setServersLoading] = useState(!!urlServerSlug)
  const [newServerName, setNewServerName] = useState('')
  const [creatingServer, setCreatingServer] = useState(false)
  const [createServerError, setCreateServerError] = useState<string | null>(null)
  const [noServerError, setNoServerError] = useState(false)

  const [step, setStep] = useState<StepIndex>(0)
  const [showPreview, setShowPreview] = useState(false)

  const [townSquare, setTownSquare] = useState<TownSquareGameState | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [customScript, setCustomScript] = useState<CustomScript | null>(null)
  const [customRoles, setCustomRoles] = useState<RoleInfo[]>([])

  // storyteller and playerCount are gathered in ImportPanel (step 2), not in MetaPanel
  const [storyteller, setStoryteller] = useState('')

  const [metaFormValues, setMetaFormValues] = useState<MetaFormValues>({
    gameName: '',
    title: '',
    subtitle: '',
    playedOn: '',
    edition: '',
    winner: '',
  })
  const [committedPhases, setCommittedPhases] = useState<GamePhase[]>([
    defaultPregamePhase(),
    emptyGrimoireRevealPhase(),
  ])

  const [formResetToken, setFormResetToken] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loadingImport, setLoadingImport] = useState(false)

  // Resolve server slug from URL to serverId (e.g. /s/ravenswood/add)
  useEffect(() => {
    if (!urlServerSlug) return
    const load = async () => {
      try {
        const server = await getServerBySlug(urlServerSlug)
        setResolvedServerId(server.serverId)
        setSelectedServerId(server.serverId)
      } catch {
        // e.g. 404
      } finally {
        setServersLoading(false)
      }
    }
    load()
  }, [urlServerSlug])

  // Load user's servers when coming from dashboard (no URL server slug)
  useEffect(() => {
    if (urlServerSlug) return
    const load = async () => {
      try {
        const res = await getServers()
        setMyServers(res.items)
        if (res.items.length === 1) setSelectedServerId(res.items[0].serverId)
      } catch {
        // ignore
      } finally {
        setServersLoading(false)
      }
    }
    load()
  }, [urlServerSlug])

  // Load existing game when edit=gameId is in URL (edit mode). Run once per edit id.
  const [editLoadedId, setEditLoadedId] = useState<string | null>(null)
  useEffect(() => {
    if (!editGameId) setEditLoadedId(null)
  }, [editGameId])

  // Load existing game when path is /s/:serverSlug/games/:gameSlug/edit (edit by slug).
  const [editSlugLoaded, setEditSlugLoaded] = useState<string | null>(null)
  useEffect(() => {
    if (!urlGameSlug || !resolvedServerId || editSlugLoaded === urlGameSlug) return
    const load = async () => {
      try {
        const doc = await getServerGameBySlug(resolvedServerId, urlGameSlug)
        setEditSlugLoaded(urlGameSlug)
        setEditLoadedId(doc.gameId)
        setDraftId(doc.gameId)
        if (doc.townSquare) setTownSquare(doc.townSquare)
        setStoryteller(doc.meta?.storyteller ?? '')
        setMetaFormValues({
          gameName: doc.name ?? '',
          title: doc.title ?? '',
          subtitle: doc.subtitle ?? '',
          playedOn: doc.meta?.playedOn ?? '',
          edition: doc.meta?.edition ?? 'tb',
          winner: doc.winner === 'good' || doc.winner === 'evil' ? doc.winner : '',
        })
        setCustomScript(doc.meta?.script ?? null)
        setCustomRoles(doc.meta?.customRoles ?? [])
        if (doc.phases && Array.isArray(doc.phases) && doc.phases.length > 0) {
          const phases = doc.phases as GamePhase[]
          const last = phases[phases.length - 1]
          setCommittedPhases(
            last?.type === PhaseType.GRIMOIRE_REVEAL ? phases : [...phases, emptyGrimoireRevealPhase()],
          )
        }
        setFormResetToken((t) => t + 1)
      } catch {
        // e.g. 403 or 404; leave form in create state
      }
    }
    load()
  }, [resolvedServerId, urlGameSlug, editSlugLoaded])

  useEffect(() => {
    if (!resolvedServerId || !editGameId || editLoadedId === editGameId) return
    const load = async () => {
      try {
        const doc = await getServerGame(resolvedServerId, editGameId)
        setEditLoadedId(editGameId)
        setDraftId(doc.gameId)
        if (doc.townSquare) setTownSquare(doc.townSquare)
        setStoryteller(doc.meta?.storyteller ?? '')
        setMetaFormValues({
          gameName: doc.name ?? '',
          title: doc.title ?? '',
          subtitle: doc.subtitle ?? '',
          playedOn: doc.meta?.playedOn ?? '',
          edition: doc.meta?.edition ?? 'tb',
          winner: doc.winner === 'good' || doc.winner === 'evil' ? doc.winner : '',
        })
        setCustomScript(doc.meta?.script ?? null)
        setCustomRoles(doc.meta?.customRoles ?? [])
        if (doc.phases && Array.isArray(doc.phases) && doc.phases.length > 0) {
          const phases = doc.phases as GamePhase[]
          const last = phases[phases.length - 1]
          setCommittedPhases(
            last?.type === PhaseType.GRIMOIRE_REVEAL ? phases : [...phases, emptyGrimoireRevealPhase()],
          )
        }
        setFormResetToken((t) => t + 1)
      } catch {
        // e.g. 403 if not owner; leave form in create state
      }
    }
    load()
  }, [resolvedServerId, editGameId, editLoadedId])

  const rolesList = useMemo(() => {
    const edition = metaFormValues.edition
    if (edition === 'custom') {
      const base = customRoles.map((r) => ({ id: r.id, name: r.name }))
      return [...base, UNKNOWN_ROLE_OPTION]
    }
    if (edition === 'tb' || edition === 'bmr' || edition === 'snv') {
      return [...getRolesListByEdition(edition), UNKNOWN_ROLE_OPTION]
    }
    return [...getRolesList(), UNKNOWN_ROLE_OPTION]
  }, [metaFormValues.edition, customRoles])

  const bluffsRoleList = useMemo(
    () =>
      getBluffsRoleOptions(metaFormValues.edition, customRoles.length ? customRoles : undefined),
    [metaFormValues.edition, customRoles]
  )

  const playerCount = townSquare?.players.length ?? 0

  const game = townSquare
    ? townSquareToGame(townSquare, {
      gameId: draftId ?? 'draft',
      title: metaFormValues.title || 'Preview',
      subtitle: metaFormValues.subtitle || undefined,
      meta: {
        playedOn: metaFormValues.playedOn,
        edition: metaFormValues.edition as EditionId,
        playerCount,
        storyteller,
        script: customScript ?? undefined,
        customRoles: customRoles.length > 0 ? customRoles : undefined,
      },
      phases: committedPhases.length > 0 ? committedPhases : undefined,
    })
    : null
  const derivedGame = game ? deriveGame(game) : null

  const handleCreateServer = async () => {
    const name = newServerName.trim()
    if (!name) return
    setCreatingServer(true)
    setCreateServerError(null)
    try {
      const server = await createServer(name)
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

  /** Save draft. Pass `notify: true` to show a success/error toast (use for explicit "Save" button clicks only). */
  const saveDraft = useCallback(
    async (payload: GameUpdateBody, opts?: { notify?: boolean }) => {
      if (!selectedServerId) return  // silently skip — data held in local state
      setSaving(true)
      try {
        if (draftId) {
          await updateGame(selectedServerId, draftId, payload)
        } else {
          const created = await createGame(selectedServerId, payload)
          setDraftId(created.gameId)
        }
        if (opts?.notify) toast.success('Game saved')
      } catch {
        if (opts?.notify) toast.error('Save failed')
      } finally {
        setSaving(false)
      }
    },
    [selectedServerId, draftId],
  )

  const handleFileUpload = async (file: File) => {
    setLoadingImport(true)
    try {
      const res = await processGrimoire(file)
      setTownSquare(res.townSquare)
      await saveDraft({ townSquare: res.townSquare })
    } finally {
      setLoadingImport(false)
    }
  }

  const handlePasteSubmit = async (json: string) => {
    setLoadingImport(true)
    try {
      const res = await parseGrimoireJson(JSON.parse(json) as Record<string, unknown>)
      setTownSquare(res.townSquare)
      if (res.meta) {
        // Extract storyteller separately; never auto-change the edition the user picked
        const { storyteller: st, playerCount: _pc, edition: _ed, ...metaRest } = res.meta as Record<string, unknown>
        setMetaFormValues((prev) => ({ ...prev, ...(metaRest as Partial<MetaFormValues>) }))
        if (typeof st === 'string' && st) setStoryteller(st)
      }
      await saveDraft({ townSquare: res.townSquare })
    } finally {
      setLoadingImport(false)
    }
  }

  const handleReplaceWithPaste = async (json: string) => {
    if (!selectedServerId || !draftId) return
    setLoadingImport(true)
    try {
      const res = await parseGrimoireJson(JSON.parse(json) as Record<string, unknown>)
      setTownSquare(res.townSquare)
      if (res.meta) {
        const { storyteller: st, playerCount: _pc, edition: _ed, ...metaRest } = res.meta as Record<string, unknown>
        setMetaFormValues((prev) => ({ ...prev, ...(metaRest as Partial<MetaFormValues>) }))
        if (typeof st === 'string' && st) setStoryteller(st)
      }
      await updateGame(selectedServerId, draftId, { townSquare: res.townSquare })
    } finally {
      setLoadingImport(false)
    }
  }

  const buildMeta = () => ({
    playedOn: metaFormValues.playedOn,
    edition: metaFormValues.edition as EditionId,
    playerCount,
    storyteller,
    script: customScript ?? undefined,
    customRoles: customRoles.length > 0 ? customRoles : undefined,
  })

  const saveMetaPayload = (data: MetaFormValues): GameUpdateBody => ({
    name: data.gameName || undefined,
    title: data.title || undefined,
    subtitle: data.subtitle || undefined,
    winner: data.winner,
    meta: buildMeta(),
  })

  const handleSaveMeta = async (data: MetaFormValues) => {
    setMetaFormValues(data)
    await saveDraft(saveMetaPayload(data))
    setStep(2)
  }

  // Explicit "Save" on Meta step — shows toast
  const handleSaveMetaOnly = async (data: MetaFormValues) => {
    setMetaFormValues(data)
    await saveDraft(saveMetaPayload(data), { notify: true })
  }

  const handleSavePhaseDraft = async (phases: GamePhase[]) => {
    setCommittedPhases(phases)
    await saveDraft({ phases })
  }

  // Explicit "Save" on Import step — shows toast
  const handleSaveImportDraft = useCallback(async () => {
    if (!townSquare) return
    await saveDraft({
      townSquare,
      meta: {
        playedOn: metaFormValues.playedOn,
        edition: metaFormValues.edition as EditionId,
        playerCount: townSquare.players.length,
        storyteller,
        script: customScript ?? undefined,
        customRoles: customRoles.length > 0 ? customRoles : undefined,
      },
    }, { notify: true })
  }, [townSquare, storyteller, saveDraft, metaFormValues, customScript, customRoles])

  const handlePublishGame = async (phases: GamePhase[]) => {
    if (!selectedServerId) {
      setNoServerError(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (metaFormValues.edition === 'custom') {
      const hasScript =
        customScript?.meta?.name?.trim() &&
        customScript?.meta?.author?.trim() &&
        Array.isArray(customScript.roles) &&
        customScript.roles.length > 0
      if (!hasScript) {
        toast.error('Custom script requires a name, author, and at least one role.')
        return
      }
    }
    setSaving(true)
    setNoServerError(false)
    try {
      const serverSlug = urlServerSlug ?? selectedServer?.slug
      if (draftId) {
        const updated = await updateGame(selectedServerId, draftId, {
          phases,
          winner: metaFormValues.winner,
        })
        const gameSlug = updated.slug ?? updated.gameId
        if (serverSlug) {
          navigate(`/s/${serverSlug}?gameSaved=${encodeURIComponent(gameSlug)}`)
        } else {
          navigate(`/dashboard?gameSaved=${encodeURIComponent(gameSlug)}`)
        }
      } else {
        const created = await createGame(selectedServerId, {
          ...saveMetaPayload(metaFormValues),
          townSquare: townSquare ?? undefined,
          phases,
        })
        const gameSlug = created.slug ?? created.gameId
        if (serverSlug) {
          navigate(`/s/${serverSlug}?gameSaved=${encodeURIComponent(gameSlug)}`)
        } else {
          navigate(`/dashboard?gameSaved=${encodeURIComponent(gameSlug)}`)
        }
      }
    } catch {
      toast.error('Failed to save game')
    } finally {
      setSaving(false)
    }
  }

  const handleImportGameJsonPrefill = useCallback(
    (prefill: {
      townSquare: TownSquareGameState | null
      metaFormValues: Partial<MetaFormValues>
      phases: GamePhase[] | null
      title: string
      subtitle: string
      name: string
      storyteller: string
      customScript: CustomScript | null
      customRoles: RoleInfo[]
    }) => {
      setTownSquare(prefill.townSquare)
      setMetaFormValues((prev) => ({ ...prev, ...prefill.metaFormValues }))
      if (prefill.storyteller) setStoryteller(prefill.storyteller)
      if (prefill.phases && prefill.phases.length > 0) setCommittedPhases(prefill.phases)
      setCustomScript(prefill.customScript)
      setCustomRoles(prefill.customRoles)
      setFormResetToken((t) => t + 1)
      setStep(1)
    },
    [],
  )

  const goBack = () => {
    if (step > 0) setStep((s) => (s - 1) as StepIndex)
  }

  const selectedServer = myServers.find((s) => s.serverId === selectedServerId)
  const backLink = urlServerSlug
    ? `/s/${urlServerSlug}`
    : selectedServer?.slug
      ? `/s/${selectedServer.slug}`
      : '/dashboard'

  if (showPreview && derivedGame) {
    return (
      <div className="fixed inset-0 z-9999 overflow-auto bg-background">
        <GameView game={derivedGame} gameId={draftId ?? undefined} />
        <div className="fixed right-1/2 top-2 z-10000 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPreview(false)}
          >
            ← Back to editing
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <Link to={backLink} className="text-sm text-primary hover:underline">
            ← Back
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-primary">
            {editGameId || urlGameSlug ? 'Edit game' : 'Add game'}
          </h1>
          <p className="text-muted-foreground">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>

        {/* Server picker — shown when not coming from a specific server URL */}
        {!urlServerSlug && (
          <div
            className={`mb-6 rounded-lg border p-4 ${noServerError ? 'border-destructive bg-destructive/5' : 'border-border bg-card'
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
              className={`rounded border px-3 py-1.5 text-sm font-medium transition-colors ${step === i
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground hover:bg-muted/60'
                }`}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {step === 0 && (
          <ImportGameJsonPanel
            onPrefill={handleImportGameJsonPrefill}
            onSkip={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <MetaPanel
            key={formResetToken}
            defaultValues={metaFormValues}
            saving={saving}
            derivedGame={derivedGame}
            edition={metaFormValues.edition}
            onBack={goBack}
            onSave={handleSaveMetaOnly}
            onSaveAndNext={handleSaveMeta}
          />
        )}

        {step === 2 && (
          <ImportPanel
            townSquare={townSquare}
            saving={saving}
            loading={loadingImport}
            rolesList={rolesList}
            bluffsRoleList={bluffsRoleList}
            derivedGame={derivedGame}
            edition={metaFormValues.edition}
            customScript={customScript}
            customRoles={customRoles}
            storyteller={storyteller}
            onCustomScriptChange={setCustomScript}
            onCustomRolesChange={setCustomRoles}
            onFileUpload={handleFileUpload}
            onPasteSubmit={handlePasteSubmit}
            onReplaceWithPaste={handleReplaceWithPaste}
            onUpdateTownSquare={setTownSquare}
            onStorytellerChange={setStoryteller}
            onBack={goBack}
            onNext={() => setStep(3)}
            onSwitchScript={(edition) =>
              setMetaFormValues((prev) => ({ ...prev, edition }))
            }
            onSaveDraft={handleSaveImportDraft}
          />
        )}

        {step === 3 && (
          <EventsPanel
            key={formResetToken}
            players={game?.players ?? []}
            rolesList={rolesList}
            defaultPhases={committedPhases}
            saving={saving}
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
