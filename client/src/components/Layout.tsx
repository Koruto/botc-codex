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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-primary">
            BotC Codex
          </Link>
          <ul className="flex items-center gap-4">
            <li>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
            </li>
            {!isLoading && user && (
              <>
                <li>
                  <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/me/games" className="text-sm text-muted-foreground hover:text-foreground">
                    My games
                  </Link>
                </li>
              </>
            )}
          </ul>
          <div className="flex items-center gap-3">
            {isLoading ? null : user ? (
              <>
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground">
                  {user.username}
                </Link>
                <Button variant="logout" size="sm" onClick={handleLogout}>
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
