import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'

const FAQ_ITEMS = [
  { q: 'Is it actually free?', a: 'Yes — no limits on games, members, or servers. Core logging stays free forever.' },
  { q: 'Do I need to be the Storyteller to use it?', a: 'No. Any player can log games and track their stats. Servers can have multiple editors.' },
  { q: 'Can people read our games without an account?', a: 'Yes, for published games. Share a link — anyone can read the storyboard without logging in.' },
  { q: 'How does the Grimoire Scan work?', a: 'Photograph your physical grimoire at end of game. The app reads the token positions and builds the role reveal automatically.' },
  { q: 'Does it work for online BotC?', a: 'Yes. Storyboard builder is manual input, so it works for any format. Grimoire Scan is for physical games only.' },
  { q: "Can I log games we've already played?", a: "Yes — set any past date. Partial logs are supported for sessions you don't remember in full." },
] as const

export function LandingPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  )
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.reveal)
            if (!Number.isNaN(i)) setRevealed((prev) => new Set(prev).add(i))
          }
        })
      },
      { threshold: 0.08 }
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed left-0 right-0 top-0 z-100 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-sm">
        <Link to="/" className="font-app-display text-base font-semibold text-foreground">
          BotC <em className="italic text-primary">Codex</em>
        </Link>
        <nav className="flex items-center gap-8">
          <Link to="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            title="Toggle dark mode"
            aria-label="Toggle theme"
            className="flex items-center gap-2 rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <span className="text-sm">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <div className="h-5 w-9 rounded-full bg-border p-0.5">
              <div
                className={cn(
                  'h-4 w-4 rounded-full bg-card shadow-sm transition-transform',
                  theme === 'dark' && 'translate-x-4'
                )}
              />
            </div>
          </button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/dashboard">Log a game</Link>
          </Button>
        </div>
      </header>

      <section className="px-6 pb-24 pt-36 text-center md:pt-40">
        <div className="mx-auto max-w-[700px]">
          <p className="mb-8 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            For Blood on the Clocktower groups
          </p>
          <h1 className="font-app-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Your group played a great game.
            <br />
            <em className="block italic text-primary">Don&apos;t let it disappear.</em>
          </h1>
          <p className="mx-auto mb-10 max-w-[480px] text-lg leading-relaxed text-muted-foreground">
            BotC Codex keeps a permanent record of every session — who played what, what happened each
            night, and how it all ended.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/login">Log your first game</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <a href="#features">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-sm italic text-muted-foreground/80">Free. No credit card.</p>
        </div>
      </section>

      <section
        className={cn(
          'border-t border-border bg-background-alt px-6 py-16 transition-opacity duration-500 md:py-24',
          revealed.has(0) ? 'opacity-100' : 'translate-y-5 opacity-0'
        )}
        data-reveal="0"
      >
        <div className="mx-auto max-w-[1000px]">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Who it&apos;s for
          </p>
          <h2 className="font-app-display mb-14 text-center text-2xl font-semibold leading-tight text-foreground md:text-3xl">
            Anyone who plays BotC
            <br />
            <em className="italic">regularly with the same people</em>
          </h2>
          <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">
            {[
              { icon: '🎭', name: 'Storytellers', body: 'Log every game you run. Photograph the grimoire. Give your players something to look back on.' },
              { icon: '🏡', name: 'Servers & groups', body: "Build a shared archive of your group's history. New players can read through everything before their first session." },
              { icon: '🔍', name: 'Players', body: 'Track your stats, see your role history, and share a link to any game so anyone can follow along.' },
            ].map((card) => (
              <div
                key={card.name}
                className="bg-card p-6 transition-colors hover:bg-muted/80"
              >
                <div className="mb-4 text-2xl">{card.icon}</div>
                <div className="mb-2 text-sm font-medium text-foreground">{card.name}</div>
                <p className="text-sm leading-relaxed text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className={cn(
          'border-t border-border bg-background px-6 py-16 transition-opacity duration-500 md:py-24',
          revealed.has(1) ? 'opacity-100' : 'translate-y-5 opacity-0'
        )}
        data-reveal="1"
      >
        <div className="mx-auto max-w-[1000px]">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Features
          </p>
          <h2 className="font-app-display mb-16 text-center text-2xl font-semibold text-foreground md:text-3xl">
            Four reasons to start logging
          </h2>
          <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
            {[
              { num: '01', name: 'Game Journal', body: 'Script, player list, roles, outcome. A searchable record of every session your server has ever played.' },
              { num: '02', name: 'Storyboard', body: 'Day and night, in order. Who nominated whom, who died at dawn — reconstructed so anyone can watch it back.' },
              { num: '03', name: 'Grimoire Scan', body: 'Photograph your grimoire at end of game. Computer vision reads the tokens and builds the role reveal automatically.' },
              { num: '04', name: 'Role Compendium', body: '200+ roles across all scripts, indexed by alignment and ability. Fast lookup mid-session, first-night reminders for STs.' },
            ].map((f) => (
              <div key={f.num} className="bg-card p-6 transition-colors hover:bg-muted/80">
                <div className="font-app-display mb-3 text-3xl font-light italic leading-none text-primary/70">{f.num}</div>
                <div className="mb-1 text-sm font-medium text-foreground">{f.name}</div>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div
        className={cn(
          'bg-primary px-6 py-16 text-center transition-opacity duration-500 md:py-20',
          revealed.has(2) ? 'opacity-100' : 'translate-y-5 opacity-0'
        )}
        data-reveal="2"
      >
        <p className="font-app-display mx-auto max-w-[520px] text-xl italic leading-snug text-white md:text-2xl">
          &quot;Your group remembers the highlights. The Codex remembers everything.&quot;
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.15em] text-white/60">From the intro</p>
      </div>

      <section
        id="faq"
        className={cn(
          'border-t border-border bg-background-alt px-6 py-16 transition-opacity duration-500 md:py-24',
          revealed.has(3) ? 'opacity-100' : 'translate-y-5 opacity-0'
        )}
        data-reveal="3"
      >
        <div className="mx-auto max-w-[680px]">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Questions
          </p>
          <h2 className="font-app-display mb-10 text-center text-2xl font-semibold text-foreground">
            Frequently asked
          </h2>
          <div className="border-t border-border">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={item.q}
                className="border-b border-border"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setOpenFaq(openFaq === i ? null : i)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between gap-4 py-5">
                  <span className="text-sm text-foreground">{item.q}</span>
                  <span className={cn('text-xs text-primary transition-transform', openFaq === i && 'rotate-90')}>▶</span>
                </div>
                <div className={cn('overflow-hidden transition-[max-height] duration-300', openFaq === i ? 'max-h-48' : 'max-h-0')}>
                  <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className={cn(
          'border-t border-border bg-background px-6 py-16 text-center transition-opacity duration-500 md:py-24',
          revealed.has(4) ? 'opacity-100' : 'translate-y-5 opacity-0'
        )}
        data-reveal="4"
      >
        <h2 className="font-app-display mb-2 text-2xl font-semibold text-foreground md:text-4xl">
          Log your first game today
        </h2>
        <p className="mx-auto mb-9 max-w-[420px] text-[0.95rem] leading-relaxed text-muted-foreground">
          Five minutes. A permanent record of everything — the lies, the logic, whoever got the Demon
          killed on day two.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/login">Create free account</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <a href="#features">See how it works</a>
          </Button>
        </div>
      </section>

      <footer className="flex items-center justify-between border-t border-border bg-background px-6 py-7">
        <div className="font-app-display text-sm text-muted-foreground">
          BotC <em className="italic text-primary">Codex</em>
        </div>
        <p className="text-xs text-muted-foreground/80">Not affiliated with The Pandemonium Institute.</p>
      </footer>
    </div>
  )
}
