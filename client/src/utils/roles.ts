import type { RoleOption } from '@/types'
import rolesData from '@/data/roles.json'
import tbScript from '@/data/scripts/tb.json'
import bmrScript from '@/data/scripts/bmr.json'
import snvScript from '@/data/scripts/snv.json'

type RoleRow = { id: string; name: string; team: string; edition?: string }
const roles = rolesData as RoleRow[]

const scriptByEdition = {
  tb: (tbScript as { roles: string[] }).roles,
  bmr: (bmrScript as { roles: string[] }).roles,
  snv: (snvScript as { roles: string[] }).roles,
} as const

const rolesById = new Map<string, RoleRow>(roles.map((r) => [r.id, r]))

let cachedRolesList: RoleOption[] | null = null
let cachedDemonRoleIds: Set<string> | null = null
const cachedRolesByEdition = new Map<string, RoleOption[]>()

export const UNKNOWN_ROLE_OPTION: RoleOption = { id: 'unknown', name: 'Unknown' }

export function getRolesList(): RoleOption[] {
  if (cachedRolesList) return cachedRolesList
  cachedRolesList = roles.map((r) => ({ id: r.id, name: r.name }))
  return cachedRolesList
}

export function getRolesListByEdition(edition: 'tb' | 'bmr' | 'snv'): RoleOption[] {
  const cached = cachedRolesByEdition.get(edition)
  if (cached) return cached
  const ids = scriptByEdition[edition]
  const list: RoleOption[] = ids.map((id) => {
    const row = rolesById.get(id)
    return { id, name: row?.name ?? id }
  })
  cachedRolesByEdition.set(edition, list)
  return list
}

export function getDemonRoleIds(): Set<string> {
  if (cachedDemonRoleIds) return cachedDemonRoleIds
  cachedDemonRoleIds = new Set(roles.filter((r) => r.team === 'demon').map((r) => r.id.toUpperCase()))
  return cachedDemonRoleIds
}

const BLUFF_TEAMS = new Set<string>(['townsfolk', 'outsider'])
const cachedBluffsByEdition = new Map<string, RoleOption[]>()

/** Role options for demon bluffs: only townsfolk and outsiders (no minion/demon). */
export function getBluffsRoleOptions(
  edition: string,
  customRoles?: { id: string; name: string; team?: string }[]
): RoleOption[] {
  if (edition === 'custom' && customRoles?.length) {
    const filtered = customRoles.filter(
      (r) => r.team === 'townsfolk' || r.team === 'outsider'
    )
    return filtered.map((r) => ({ id: r.id, name: r.name }))
  }
  if (edition === 'tb' || edition === 'bmr' || edition === 'snv') {
    const cached = cachedBluffsByEdition.get(edition)
    if (cached) return cached
    const ids = scriptByEdition[edition]
    const list: RoleOption[] = ids
      .filter((id) => {
        const row = rolesById.get(id)
        return row && BLUFF_TEAMS.has(row.team)
      })
      .map((id) => {
        const row = rolesById.get(id)
        return { id, name: row?.name ?? id }
      })
    cachedBluffsByEdition.set(edition, list)
    return list
  }
  return roles
    .filter((r) => BLUFF_TEAMS.has(r.team))
    .map((r) => ({ id: r.id, name: r.name }))
}

const BASE_EDITIONS = ['tb', 'bmr', 'snv'] as const
export const EDITION_LABELS: Record<string, string> = {
  tb: 'Trouble Brewing',
  bmr: 'Bad Moon Rising',
  snv: 'Sects & Violets',
  custom: 'Custom Script',
}

/**
 * Given current edition and role ids from players, suggest a base script that matches better.
 * Only for base editions (tb, bmr, snv). Returns the other script with strictly more matches, or null.
 */
export function suggestEditionForRoleIds(
  currentEdition: string,
  roleIds: string[]
): 'tb' | 'bmr' | 'snv' | null {
  if (currentEdition !== 'tb' && currentEdition !== 'bmr' && currentEdition !== 'snv') return null
  const currentSet = new Set(scriptByEdition[currentEdition])
  const currentMatches = roleIds.filter((id) => id && id !== 'unknown' && currentSet.has(id)).length
  let bestEdition: 'tb' | 'bmr' | 'snv' | null = null
  let bestCount = currentMatches
  for (const ed of BASE_EDITIONS) {
    if (ed === currentEdition) continue
    const set = new Set(scriptByEdition[ed])
    const count = roleIds.filter((id) => id && id !== 'unknown' && set.has(id)).length
    if (count > bestCount) {
      bestCount = count
      bestEdition = ed
    }
  }
  return bestEdition
}
