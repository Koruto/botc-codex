import { Outlet, Link } from 'react-router-dom'

export function Layout() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 bg-stone-900/80">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-amber-500">
            BotC Codex
          </Link>
          <ul className="flex gap-4">
            <li>
              <Link to="/" className="text-stone-300 hover:text-amber-400">
                Home
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-stone-300 hover:text-amber-400">
                Login
              </Link>
            </li>
            <li>
              <Link to="/profile" className="text-stone-300 hover:text-amber-400">
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
