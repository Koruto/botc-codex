/** Role from roles.json (id, name, ability, team). */
export interface RoleInfo {
  id: string
  name: string
  ability?: string
  team?: 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler' | 'fabled'
}

/** Player slot in the grimoire circle (name + role id). */
export interface GrimoirePlayer {
  name: string
  role: string
}
