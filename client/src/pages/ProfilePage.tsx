import { Button } from '@/components/ui/button'

export function ProfilePage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold text-primary">Profile & settings</h1>
      <p className="mb-6 text-muted-foreground">
        Account details and display preferences.
      </p>
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium text-foreground">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              defaultValue="you@example.com"
              className="w-full rounded border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Change password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <Button type="button" className="mt-4">
          Save changes
        </Button>
      </section>
      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium text-foreground">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Default POV, reduce motion, and other display options can go here.
        </p>
      </section>
    </div>
  )
}
