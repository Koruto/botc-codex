import { Button } from '@/components/ui/button'

export function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-bold text-primary">Login</h1>
      <p className="mb-6 text-muted-foreground">Sign in or create an account.</p>
      <form className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button type="submit">Sign in</Button>
        <p className="text-center text-sm text-muted-foreground">
          No account? <span className="text-primary">Sign up</span>
        </p>
      </form>
    </div>
  )
}
