import { useAuth } from '@/context/AuthContext'
import { StatItem } from '@/components/ui/StatItem'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-lg">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="app-page-title capitalize">{user?.username ?? 'Profile'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account and stats.</p>
      </div>

      {/* Account card */}
      <div className="app-card mb-5">
        <div className="px-6 py-5 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Account</span>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-start justify-between px-6 py-4">
            <span className="text-sm text-muted-foreground w-32 shrink-0">Username</span>
            <div className="text-right">
              <p className="text-sm font-medium text-primary capitalize">{user?.username}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Username cannot be changed.</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-muted-foreground w-32 shrink-0">Member since</span>
            <span className="text-sm text-foreground">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
                : '—'}
            </span>
          </div>
          <div className="flex items-start justify-between px-6 py-4">
            <span className="text-sm text-muted-foreground w-32 shrink-0">Public page</span>
            <div className="text-right">
              <a href={user ? `/u/${user.username}` : '#'} className="text-sm text-primary hover:underline">
                {user ? `/u/${user.username}` : 'Not available'}
              </a>
              <p className="mt-0.5 text-xs text-muted-foreground">Your public games are visible here.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email card */}
      <div className="app-card mb-5">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Email</span>
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Coming soon
          </span>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Adding an email lets you reset your password if you're locked out.
            Not required for your account to work.
          </p>
        </div>
      </div>

      {/* Stats card */}
      <div className="app-card">
        <div className="px-6 py-5 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Your stats</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-6 py-5">
          <StatItem value="—" label="Games logged" faint />
          <StatItem value="—" label="Servers" faint />
          <StatItem value="—" label="Good wins" faint />
          <StatItem value="—" label="Evil wins" faint />
        </div>
      </div>

    </div>
  )
}
