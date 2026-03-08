import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/Button'

export function Layout() {
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const initial = user?.username?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-[0_1px_4px_rgba(28,20,16,0.07)]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-app-display text-base font-semibold text-foreground">
            BotC <em className="italic text-primary">Codex</em>
          </Link>

          {!isLoading && user && (
            <ul className="flex items-center gap-6">
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/me/games" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  My games
                </Link>
              </li>
            </ul>
          )}

          <div className="flex items-center gap-5">
            {isLoading ? null : user ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                    {initial}
                  </span>
                  {user.username}
                </Link>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link to="/login?tab=signup">Create account</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
