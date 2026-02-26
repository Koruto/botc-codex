import type {
  Game,
  DerivedGame,
  DerivedGamePhase,
  PhaseSnapshot,
  GameEvent,
  GamePhase,
} from '@/types'

function processEvents(
  events: GameEvent[],
  deadIds: Set<string>,
  ghostVotesUsed: Set<string>
): void {
  for (const event of events) {
    if (event.type === 'death') {
      deadIds.add(event.playerId)
    }
    if (event.type === 'ghost_vote') {
      ghostVotesUsed.add(event.playerId)
    }
    if (event.type === 'ghost_vote_restored') {
      ghostVotesUsed.delete(event.playerId)
    }
    if (event.type === 'nomination') {
      const voterIds = [...(event.votesFor ?? []), ...(event.votesAgainst ?? [])]
      for (const id of voterIds) {
        if (deadIds.has(id)) ghostVotesUsed.add(id)
      }
    }
  }
}

function buildSnapshot(
  allPlayerIds: string[],
  deadIds: Set<string>,
  ghostVotesUsed: Set<string>
): PhaseSnapshot {
  const alivePlayerIds = allPlayerIds.filter(id => !deadIds.has(id))
  const deadPlayerIds = allPlayerIds.filter(id => deadIds.has(id))
  const ghostUsedCount = ghostVotesUsed.size
  const voteCount = alivePlayerIds.length + deadPlayerIds.length - ghostUsedCount

  return {
    alivePlayerIds,
    deadPlayerIds,
    ghostVotesUsed: [...ghostVotesUsed],
    aliveCount: alivePlayerIds.length,
    deadCount: deadPlayerIds.length,
    voteCount,
  }
}

export function deriveGame(game: Game): DerivedGame {
  const allPlayerIds = game.players.map(p => p.id)
  const normalizedPhases = game.phases.map(p => p as GamePhase)

  const deadIds = new Set<string>()
  const ghostVotesUsed = new Set<string>()

  const derivedPhases: DerivedGamePhase[] = normalizedPhases.map(phase => {
    // snapshot reflects state BEFORE this phase's events (entering state)
    const snapshot = buildSnapshot(allPlayerIds, deadIds, ghostVotesUsed)

    // process events after snapshot — updates rolling state for next phase
    processEvents(phase.events, deadIds, ghostVotesUsed)

    return {
      ...phase,
      snapshot,
    }
  })

  return {
    ...game,
    generatedAt: new Date().toISOString(),
    phases: derivedPhases,
  }
}