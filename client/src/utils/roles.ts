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
