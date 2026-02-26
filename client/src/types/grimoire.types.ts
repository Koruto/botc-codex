export type Player = {
  id: string                  // UUID — "__storyteller__" is reserved
  name: string
  roleId: string              // reference to role registry
  pronouns?: string
  isTraveller: boolean
  bluffs?: string[]           // roleIds, only on demon players, max 3
}

export type RoleTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller' | 'fabled'

export type RoleInfo = {
  id: string
  name: string
  edition: string
  team: RoleTeam
  ability: string
  firstNightReminder: string
  otherNightReminder: string
  reminders: string[]       // reminder tokens this role uses
  setup: boolean            // affects setup phase
  icon?: string             // we added this, optional
}

export const STORYTELLER_ID = "__storyteller__"