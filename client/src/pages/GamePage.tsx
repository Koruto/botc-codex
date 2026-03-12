import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GameView } from '../components'
import type { DerivedGame, Game, GameDocument } from '@/types'
import type { MyServerItem } from '@/types/api.types'
import { deriveGame } from '../utils/deriveGame'
import { townSquareToGame } from '../utils/townSquareToGame'
import { getGame, copyGame } from '@/api/games'
import { getServers } from '@/api/servers'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/Button'
import wizardTeensy from '../data/wizard-teensy.json'
import g3 from '../data/g3.json'

const gameData: Record<string, Game> = {
  'wizard-game': wizardTeensy as Game,
  'the-beginning': g3 as Game,
}

const defaultGame = wizardTeensy as Game

export function GamePage() {
  const { gameId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [rawDoc, setRawDoc] = useState<GameDocument | null>(null)
  const [fetchedGame, setFetchedGame] = useState<DerivedGame | null>(null)
  const [loading, setLoading] = useState(() => !!(gameId && !gameData[gameId]))
  const [error, setError] = useState<string | null>(null)

  // Copy panel state
  const [showCopyPanel, setShowCopyPanel] = useState(false)
  const [myServers, setMyServers] = useState<MyServerItem[]>([])
  const [selectedServerId, setSelectedServerId] = useState('')
  const [copyLoading, setCopyLoading] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [serversLoaded, setServersLoaded] = useState(false)

  useEffect(() => {
    if (!gameId || gameData[gameId]) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const doc = await getGame(gameId)
        setRawDoc(doc)
        const ts = doc.townSquare
        if (!ts?.players) {
          setError('Invalid game data')
          return
        }
        const game = townSquareToGame(ts, {
          gameId: doc.gameId,
          title: doc.title ?? 'Game',
          subtitle: doc.subtitle ?? undefined,
          meta: doc.meta ?? undefined,
          phases: doc.phases ?? undefined,
        })
        setFetchedGame(deriveGame(game))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load game')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [gameId])

  const openCopyPanel = async () => {
    setShowCopyPanel(true)
    setCopyError(null)
    if (!serversLoaded) {
      try {
        const res = await getServers()
        setMyServers(res.items)
        if (res.items.length > 0) setSelectedServerId(res.items[0].serverId)
      } catch {
        // ignore
      } finally {
        setServersLoaded(true)
      }
    }
  }

  const handleCopy = async () => {
    if (!gameId || !selectedServerId) return
    setCopyError(null)
    setCopyLoading(true)
    try {
      const copy = await copyGame(gameId, selectedServerId)
      navigate(`/game/${copy.gameId}`)
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : 'Copy failed')
    } finally {
      setCopyLoading(false)
    }
  }

  const game = useMemo((): DerivedGame => {
    if (gameId && gameData[gameId]) return deriveGame(gameData[gameId])
    if (fetchedGame) return fetchedGame
    return deriveGame(defaultGame)
  }, [gameId, fetchedGame])

  // Determine if copy button should be shown
  const canCopy =
    user &&
    rawDoc &&
    rawDoc.visibility === 'public' &&
    rawDoc.createdBy !== user.userId

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-300">
        Loading game…
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-950 text-stone-300">
        <p>{error}</p>
        <a href="/" className="text-amber-400 hover:underline">Back to home</a>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Copy game bar — shown for logged-in users viewing someone else's public game */}
      {canCopy && (
        <div className="absolute left-0 right-0 top-0 z-50 flex items-center justify-end gap-2 bg-stone-900/80 px-4 py-2 backdrop-blur-sm">
          {showCopyPanel ? (
            <div className="flex items-center gap-2">
              {serversLoaded && myServers.length === 0 ? (
                <span className="text-xs text-stone-400">You need to join a server first.</span>
              ) : (
                <>
                  <select
                    value={selectedServerId}
                    onChange={(e) => setSelectedServerId(e.target.value)}
                    className="rounded border border-stone-600 bg-stone-800 px-2 py-1 text-xs text-stone-200"
                  >
                    {myServers.map((s) => (
                      <option key={s.serverId} value={s.serverId}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    disabled={copyLoading || !selectedServerId}
                    className="text-xs"
                  >
                    {copyLoading ? 'Copying…' : 'Confirm copy'}
                  </Button>
                </>
              )}
              {copyError && <span className="text-xs text-red-400">{copyError}</span>}
              <button
                type="button"
                onClick={() => { setShowCopyPanel(false); setCopyError(null) }}
                className="text-xs text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={openCopyPanel} className="text-xs">
              Copy game
            </Button>
          )}
        </div>
      )}

      <GameView game={game} gameId={gameId} />
    </div>
  )
}
