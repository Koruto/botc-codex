import { X } from 'lucide-react'
import { Button } from '@/components/Button'
import rolesData from '@/data/roles.json'
import type { CustomScript, RoleInfo, RoleTeam } from '@/types/grimoire.types'

const DEFAULT_SCRIPT_META = { id: '_meta' as const, name: '', author: '' }

const TEAM_LABELS: { id: RoleTeam; label: string }[] = [
  { id: 'townsfolk', label: 'Townsfolk' },
  { id: 'outsider', label: 'Outsider' },
  { id: 'minion', label: 'Minion' },
  { id: 'demon', label: 'Demon' },
  { id: 'traveller', label: 'Traveller' },
]

const ROLE_TEAM_ORDER: RoleTeam[] = ['townsfolk', 'outsider', 'minion', 'demon', 'traveller']

export type CustomScriptSectionProps = {
  rolesList: { id: string; name: string }[]
  customScript: CustomScript | null | undefined
  customRoles: RoleInfo[]
  onCustomScriptChange: (script: CustomScript | null) => void
  onCustomRolesChange: (roles: RoleInfo[]) => void
}

export function CustomScriptSection({
  rolesList,
  customScript,
  customRoles,
  onCustomScriptChange,
  onCustomRolesChange,
}: CustomScriptSectionProps) {
  const allRoles = rolesData as RoleInfo[]

  const rolesByTeam = ROLE_TEAM_ORDER.map((team) => ({
    team,
    roles: allRoles.filter((role) => role.team === team && role.id !== 'unknown'),
  }))

  const addCustomRole = () => {
    onCustomRolesChange([
      ...(customRoles ?? []),
      {
        id: '',
        name: '',
        edition: '',
        team: 'townsfolk',
        ability: '',
        firstNightReminder: '',
        otherNightReminder: '',
        reminders: [],
        setup: false,
      },
    ])
  }

  return (
    <div className="mb-6">
      <h3 className="mb-3 text-lg font-medium text-foreground">Custom script &amp; roles</h3>

      <div className="space-y-6">
        {/* Script meta */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Script name</label>
            <input
              type="text"
              value={customScript?.meta?.name ?? ''}
              onChange={(e) =>
                onCustomScriptChange({
                  meta: { ...DEFAULT_SCRIPT_META, ...customScript?.meta, name: e.target.value },
                  roles: customScript?.roles ?? [],
                })
              }
              placeholder="e.g. My Homebrew"
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Author</label>
            <input
              type="text"
              value={customScript?.meta?.author ?? ''}
              onChange={(e) =>
                onCustomScriptChange({
                  meta: { ...DEFAULT_SCRIPT_META, ...customScript?.meta, author: e.target.value },
                  roles: customScript?.roles ?? [],
                })
              }
              placeholder="Your name"
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Roles in script */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="mb-3 text-sm font-medium text-foreground">
            Roles in script <span className="font-normal text-muted-foreground">(add from list)</span>
          </p>
          <div className="space-y-3">
            {rolesByTeam.map(({ team, roles }) => {
              const label = TEAM_LABELS.find((t) => t.id === team)?.label ?? team
              const selectedIds = new Set(customScript?.roles ?? [])
              const availableRoles = roles.filter((r) => !selectedIds.has(r.id))

              return (
                <div key={team}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(customScript?.roles ?? [])
                      .filter((id) => roles.some((r) => r.id === id))
                      .map((roleId) => (
                        <span
                          key={roleId}
                          className="group inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                        >
                          <span className="px-0.5">
                            {allRoles.find((r) => r.id === roleId)?.name ||
                              rolesList.find((r) => r.id === roleId)?.name ||
                              roleId}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() =>
                              onCustomScriptChange({
                                meta: customScript?.meta ?? { ...DEFAULT_SCRIPT_META },
                                roles: (customScript?.roles ?? []).filter((id) => id !== roleId),
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </span>
                      ))}
                    <select
                      value=""
                      onChange={(e) => {
                        const id = e.target.value
                        if (!id) return
                        onCustomScriptChange({
                          meta: customScript?.meta ?? { ...DEFAULT_SCRIPT_META },
                          roles: [...(customScript?.roles ?? []), id],
                        })
                        e.target.value = ''
                      }}
                      className="min-w-[120px] rounded border border-input bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">{`+ Add ${label}`}</option>
                      {availableRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Custom role definitions */}
        <div className="rounded-lg border border-border bg-muted/30">
          <div className="border-b border-border px-3 py-2">
            <p className="text-sm font-medium text-foreground">
              Custom role definitions <span className="font-normal text-muted-foreground">(optional)</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Add homebrew roles so they appear in the role list above.
            </p>
          </div>
          <div className="space-y-2 px-3 py-3">
            {(customRoles ?? []).map((r, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-5 text-xs text-muted-foreground">{idx + 1}.</span>
                  <input
                    type="text"
                    value={r.id}
                    onChange={(e) => {
                      const next = [...(customRoles ?? [])]
                      next[idx] = { ...next[idx], id: e.target.value }
                      onCustomRolesChange(next)
                    }}
                    placeholder="id (e.g. my_demon)"
                    className="w-32 rounded border border-input bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => {
                      const next = [...(customRoles ?? [])]
                      next[idx] = { ...next[idx], name: e.target.value }
                      onCustomRolesChange(next)
                    }}
                    placeholder="Display name"
                    className="min-w-[140px] flex-1 rounded border border-input bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <select
                    value={r.team}
                    onChange={(e) => {
                      const next = [...(customRoles ?? [])]
                      next[idx] = { ...next[idx], team: e.target.value as RoleInfo['team'] }
                      onCustomRolesChange(next)
                    }}
                    className="rounded border border-input bg-background px-2.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {TEAM_LABELS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-7 w-7 text-muted-foreground hover:text-red-500"
                    onClick={() => onCustomRolesChange((customRoles ?? []).filter((_, i) => i !== idx))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Ability</span>
                  <textarea
                    value={r.ability ?? ''}
                    onChange={(e) => {
                      const next = [...(customRoles ?? [])]
                      next[idx] = { ...next[idx], ability: e.target.value }
                      onCustomRolesChange(next)
                    }}
                    placeholder="Ability text (what this role does)"
                    className="min-h-[60px] w-full rounded border border-input bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border bg-card/60 px-3 py-2">
            <Button
              type="button"
              variant="secondary"
              onClick={addCustomRole}
              className="border border-dashed border-muted-foreground px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              + Add custom role
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

