import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { GameView } from '../components'
import type { GameViewNarrative } from '../types/game'
import wizardNarrative from '../data/wizard-game-narrative.json'
import theBeginningNarrative from '../data/the-beginning-narrative.json'

const narratives: Record<string, GameViewNarrative> = {
  'wizard-game': wizardNarrative as GameViewNarrative,
  'the-beginning': theBeginningNarrative as GameViewNarrative,
}

export function GamePage() {
  const { gameId } = useParams()
  const narrative = useMemo((): GameViewNarrative => {
    if (gameId && narratives[gameId]) return narratives[gameId]
    return wizardNarrative as GameViewNarrative
  }, [gameId])

  return <GameView narrative={narrative} gameId={gameId} />
}
