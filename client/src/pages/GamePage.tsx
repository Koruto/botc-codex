import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { GameView } from '../components'
import type { Game } from '@/types'
import { deriveGame } from '../utils/deriveGame'
import wizardTeensy from '../data/wizard-teensy.json'
import g3 from '../data/g3.json'

const gameData: Record<string, Game> = {
  'wizard-game': wizardTeensy as Game,
  'the-beginning': g3 as Game,
}

const defaultGame = wizardTeensy as Game

export function GamePage() {
  const { gameId } = useParams()
  const game = useMemo(() => {
    const g = (gameId && gameData[gameId]) ? gameData[gameId] : defaultGame
    return deriveGame(g)
  }, [gameId])

  return <GameView game={game} gameId={gameId} />
}
