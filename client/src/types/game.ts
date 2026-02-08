/**
 * Phase convention: 0 = setup, 1 = night 1, 2 = day 1, 3 = night 2, 4 = day 2, ...
 */

export interface NarrativeEvent {
  label: string
  body: string
}

/** Stats for the grimoire first row: alive count and how many can vote (alive + dead who still have vote). */
export interface PhaseStats {
  alive: number
  voteCount: number
}

export interface NarrativePhase {
  /** 0 = setup, 1 = night 1, 2 = day 1, 3 = night 2, ... */
  phaseIndex: number
  title: string
  subtitle: string
  events: NarrativeEvent[]
  /** For grimoire: how many alive and how many can vote in this phase. */
  stats?: PhaseStats
}

export interface GameViewNarrative {
  title: string
  subtitle: string
  meta: { played: string; edition: string; playerCount: number; storyteller?: string }
  timeline: { phaseLabels: string[]; beats: NarrativePhase[] }
  townSquare?: object
}

/** Props for the story content (phase title, subtitle, events). */
export interface GameStoryPhase {
  title: string
  subtitle: string
  events: { label: string; body: string }[]
}
