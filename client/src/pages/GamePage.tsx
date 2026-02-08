import { useParams } from 'react-router-dom'
import { GameView } from '../components'
import type { GameViewNarrative } from '../types/game'
import gameNarrative from '../data/wizard-game-narrative.json'

const narrative = gameNarrative as GameViewNarrative

export function GamePage() {
  const { gameId } = useParams()

  return <GameView narrative={narrative} gameId={gameId} />
}
