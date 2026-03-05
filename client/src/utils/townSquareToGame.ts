import type { Game, GameMeta, GamePhase, Player } from '@/types'
import { PhaseType } from '@/types'
import { getDemonRoleIds } from '@/utils/roles'

function slug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Map Town Square Game State to our Player list.
 * Import = names and roles only; bluffs assigned to the single demon.
 * Demon role ids come from roles data (team === 'demon').
 */
export function townSquareToPlayers(townSquare: {
  bluffs: string[]
  players: { name: string; id: string; role: string; isVoteless?: boolean }[]
}): Player[] {
  const demonRoleIds = getDemonRoleIds()
  const demonRole = townSquare.players.find((p) => demonRoleIds.has(p.role))
  const bluffs = demonRole ? townSquare.bluffs : []

  return townSquare.players.map((p) => {
    const id = p.id && p.id.trim() ? p.id : slug(p.name)
    const isDemon = demonRoleIds.has(p.role)
    return {
      id,
      name: p.name.trim() || p.name,
      roleId: p.role,
      pronouns: '',
      isTraveller: p.isVoteless ?? false,
      ...(isDemon && bluffs.length > 0 ? { bluffs } : {}),
    }
  })
}

const DEFAULT_META: GameMeta = {
  playedOn: '',
  edition: '',
  playerCount: 0,
  storyteller: '',
}

export function defaultPregamePhase(): GamePhase {
  return {
    type: PhaseType.PREGAME,
    title: 'Pre-Game',
    subtitle: 'The grimoire is set.',
    events: [
      {
        type: 'narrative',
        label: 'Setup',
        body: 'Players take their seats. The first night approaches.',
      },
    ],
  }
}

export function emptyPhase(type: 'day' | 'night', phaseNumber: number): GamePhase {
  const isDay = type === 'day'
  return {
    type: isDay ? PhaseType.DAY : PhaseType.NIGHT,
    phaseNumber,
    title: isDay ? `Day ${phaseNumber}` : `Night ${phaseNumber}`,
    subtitle: '',
    events: [],
  }
}

/**
 * Build a minimal Game from Town Square + optional meta/phases for preview and persistence.
 */
export function townSquareToGame(
  townSquare: { bluffs: string[]; players: { name: string; id: string; role: string; isVoteless?: boolean }[] },
  options: {
    meta?: Partial<GameMeta> | null
    phases?: GamePhase[] | null
    title?: string
    subtitle?: string
    gameId?: string
  } = {}
): Game {
  const players = townSquareToPlayers(townSquare)
  const meta: GameMeta = {
    ...DEFAULT_META,
    playerCount: players.length,
    ...options.meta,
  }
  const phases = options.phases && options.phases.length > 0
    ? options.phases
    : [defaultPregamePhase()]

  return {
    schemaVersion: '1.0.0',
    gameId: options.gameId ?? 'draft',
    title: options.title ?? 'New Game',
    subtitle: options.subtitle,
    meta,
    winner: 'good',
    players,
    phases,
  }
}
