import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/Button'
import { Navbar } from '@/components/Navbar'

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
      <Navbar
        center={!isLoading && user ? (
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link to="/me/games" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              My games
            </Link>
          </nav>
        ) : undefined}
      >
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
      </Navbar>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
