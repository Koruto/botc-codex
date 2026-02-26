import { PhaseType, type GamePhase } from '@/types'

export function phaseLabel(phase: GamePhase, index: number): string {
  const n = phase.phaseNumber ?? Math.floor((index + 1) / 2)
  switch (phase.type) {
    case PhaseType.PREGAME: return 'Pre-Game'
    case PhaseType.GRIMOIRE_REVEAL: return 'Grimoire Reveal'
    case PhaseType.NIGHT: return `Night ${n}`
    case PhaseType.DAY: return `Day ${n}`
  }
}

export function toShorthand(labels: string[]): string[] {
  const counts: Record<string, number> = { Night: 0, Day: 0 }
  return labels.map((label) => {
    switch (true) {
      case label === 'Pre-Game': return 'PG'
      case label === 'Grimoire Reveal': return 'GR'
      case label.startsWith('Night'): counts.Night++; return `N${counts.Night}`
      case label.startsWith('Day'): counts.Day++; return `D${counts.Day}`
      default: return label.substring(0, 2).toUpperCase()
    }
  })
}
