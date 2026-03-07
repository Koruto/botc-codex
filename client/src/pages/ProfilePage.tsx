import { useAuth } from '@/context/AuthContext'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold text-primary">Profile</h1>
      <p className="mb-6 text-muted-foreground">Your account details.</p>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium text-foreground">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Username</label>
            <p className="rounded border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
              {user?.username}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Username cannot be changed.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Member since</label>
            <p className="text-sm text-foreground">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <h2 className="mb-2 text-lg font-medium text-foreground">Email</h2>
        <p className="text-sm text-muted-foreground">
          Adding an email address lets you reset your password if you're ever locked out. No email
          required for your account to work.
        </p>
        <p className="mt-3 text-xs text-muted-foreground italic">
          Email management coming soon.
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <h2 className="mb-2 text-lg font-medium text-foreground">Public page</h2>
        <p className="text-sm text-muted-foreground">
          Your public games are visible at{' '}
          <a
            href={`/user/${user?.username}`}
            className="text-primary hover:underline"
          >
            /user/{user?.username}
          </a>
          .
        </p>
      </section>
    </div>
  )
}
