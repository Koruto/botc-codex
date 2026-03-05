import { Outlet, Link } from 'react-router-dom'

export function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-primary">
            BotC Codex
          </Link>
          <ul className="flex gap-4">
            <li>
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-muted-foreground hover:text-foreground">
                Login
              </Link>
            </li>
            <li>
              <Link to="/profile" className="text-muted-foreground hover:text-foreground">
                Profile
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
