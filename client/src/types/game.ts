/**
 * Phase convention: 0 = setup, 1 = night 1, 2 = day 1, 3 = night 2, 4 = day 2, ...
 */

export interface NarrativeEventBase {
  label: string
  body: string
  /** Optional map of player name -> new role ID to update state at this event. */
  roleUpdates?: Record<string, string>
}

export interface NarrativeEvent extends NarrativeEventBase {
  type?: undefined
}

/** Nomination beat: who nominated whom (player names as in grimoire/townSquare). */
export interface NominationEvent extends NarrativeEventBase {
  type: 'nomination'
  nominator: string
  nominee: string
  /** Optional label for nominee when not a player (e.g. "Storyteller"). */
  nomineeLabel?: string
  nomineeIsStoryteller?: boolean
  /** Player names who voted for execution (get hand icon, then thumbs up when clock passes). */
  votesFor?: string[]
  votesAgainst?: string[]
  /** When true, nominee was executed (show skull on their token when rotation done). */
  executed?: boolean
}

export type TimelineEvent = NarrativeEvent | NominationEvent

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
  events: TimelineEvent[]
  /** For grimoire: how many alive and how many can vote in this phase. */
  stats?: PhaseStats
}

export interface GameViewNarrative {
  title: string
  subtitle: string
  meta: { played: string; edition: string; playerCount: number; storyteller?: string }
  timeline: { phaseLabels: string[]; beats: NarrativePhase[] }
  townSquare?: {
    players: Array<{ name: string; role: string }>
  }
  players: Array<{ name: string; role: string; pronouns: string; deathAtBeat: number | null }>
}

/** Props for the story content (phase title, subtitle, events). */
export interface GameStoryPhase {
  title: string
  subtitle: string
  events: { label: string; body: string }[]
}
