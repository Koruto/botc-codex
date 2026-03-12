import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavLink {
  label: string
  href: string
}

interface NavbarProps {
  links?: NavLink[]
  center?: React.ReactNode
  fixed?: boolean
  children?: React.ReactNode
}

export function Navbar({ links, center, fixed = false, children }: NavbarProps) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <header
      className={cn(
        'left-0 right-0 top-0 z-50 grid h-[58px] grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-card px-6 shadow-[0_1px_4px_rgba(28,20,16,0.07)] dark:shadow-[0_1px_0_rgba(210,110,90,0.28),0_4px_32px_rgba(0,0,0,0.7)] md:px-12',
        fixed ? 'fixed z-100' : 'sticky',
      )}
    >
      <Link to="/" className="font-app-display text-[1.05rem] font-semibold text-foreground">
        BotC <em className="italic text-primary">Codex</em>
      </Link>

      <div className="flex justify-center">
        {center ?? (links && links.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex items-center gap-1.5 rounded-md p-1 text-muted-foreground transition-opacity hover:opacity-80"
        >
          <span className="text-sm leading-none">{isDark ? '☀️' : '🌙'}</span>
          <div className={cn('h-5 w-9 rounded-full p-0.5 transition-colors', isDark ? 'bg-primary/60' : 'bg-foreground/25')}>
            <div className={cn('h-4 w-4 rounded-full bg-white shadow-sm transition-transform', isDark && 'translate-x-4')} />
          </div>
        </button>

        {children}
      </div>
    </header>
  )
}
