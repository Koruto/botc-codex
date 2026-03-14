import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { GameView } from '../components'
import type { DerivedGame, Game, GameDocument } from '@/types'
import { deriveGame } from '../utils/deriveGame'
import { townSquareToGame } from '../utils/townSquareToGame'
import { getGameBySlug, } from '@/api/games'
import wizardTeensy from '../data/wizard-teensy.json'

const defaultGame = wizardTeensy as Game

export function GamePage() {
  const { gameSlug } = useParams<{ gameSlug?: string }>()

  const [rawDoc, setRawDoc] = useState<GameDocument | null>(null)
  const [fetchedGame, setFetchedGame] = useState<DerivedGame | null>(null)
  const [loading, setLoading] = useState(() => !!gameSlug)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    if (!gameSlug) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const doc = await getGameBySlug(gameSlug)
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
  }, [gameSlug])

  const game = useMemo((): DerivedGame => {
    if (fetchedGame) return fetchedGame
    return deriveGame(defaultGame)
  }, [fetchedGame])

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
      <GameView game={game} gameId={rawDoc?.gameId ?? gameSlug} />
    </div>
  )
}
