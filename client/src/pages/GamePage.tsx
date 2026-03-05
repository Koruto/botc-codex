import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { GameView } from '../components'
import type { DerivedGame, Game, GamePhase } from '@/types'
import { deriveGame } from '../utils/deriveGame'
import { townSquareToGame } from '../utils/townSquareToGame'
import { api } from '@/api/client'
import wizardTeensy from '../data/wizard-teensy.json'
import g3 from '../data/g3.json'

const gameData: Record<string, Game> = {
  'wizard-game': wizardTeensy as Game,
  'the-beginning': g3 as Game,
}

const defaultGame = wizardTeensy as Game

export function GamePage() {
  const { gameId } = useParams()
  const [fetchedGame, setFetchedGame] = useState<DerivedGame | null>(null)
  const [loading, setLoading] = useState(() => !!(gameId && !gameData[gameId]))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!gameId || gameData[gameId]) return
    setLoading(true)
    setError(null)
    api
      .getGameById(gameId)
      .then((doc) => {
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
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load game'))
      .finally(() => setLoading(false))
  }, [gameId])

  const game = useMemo((): DerivedGame => {
    if (gameId && gameData[gameId]) return deriveGame(gameData[gameId])
    if (fetchedGame) return fetchedGame
    return deriveGame(defaultGame)
  }, [gameId, fetchedGame])

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

  return <GameView game={game} gameId={gameId} />
}
