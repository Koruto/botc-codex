import type { RoleOption } from '@/types'
import rolesData from '@/data/roles.json'

type RoleRow = { id: string; name: string; team: string }
const roles = rolesData as RoleRow[]

let cachedRolesList: RoleOption[] | null = null
let cachedDemonRoleIds: Set<string> | null = null

export function getRolesList(): RoleOption[] {
  if (cachedRolesList) return cachedRolesList
  cachedRolesList = roles.map((r) => ({ id: r.id, name: r.name }))
  return cachedRolesList
}

export function getDemonRoleIds(): Set<string> {
  if (cachedDemonRoleIds) return cachedDemonRoleIds
  cachedDemonRoleIds = new Set(roles.filter((r) => r.team === 'demon').map((r) => r.id.toUpperCase()))
  return cachedDemonRoleIds
}
