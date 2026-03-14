import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const LANDING_NAV_LINKS = [
  { label: 'Games', href: '#games' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
]

const FAQ_ITEMS = [
  { q: 'Is it actually free?', a: 'Yes — no limits on games, members, or servers. Core logging stays free forever.' },
  { q: 'Do I need to be the Storyteller to use it?', a: 'No. Any player can log games and track their stats. Servers can have multiple editors.' },
  { q: 'Can people read our games without an account?', a: 'Yes, for published games. Share a link — anyone can read the storyboard without logging in.' },
  { q: 'How does the Grimoire Scan work?', a: 'Photograph your physical grimoire at end of game. The app reads the token positions and builds the role reveal automatically.' },
  { q: 'Does it work for online BotC?', a: 'Yes. Storyboard builder is manual input, so it works for any format. Grimoire Scan is for physical games only.' },
  { q: "Can I log games we've already played?", a: "Yes — set any past date. Partial logs are supported for sessions you don't remember in full." },
] as const

const GAME_CARDS = [
  {
    server: 'Ravenswood Collective',
    result: 'evil' as const,
    title: 'The Empath lied to everyone for six nights — and pulled it off',
    desc: 'Nobody suspected the Empath was the Demon. Perfect numbers fed to a town that built their entire logic on a lie.',
    script: 'Sects & Violets · 12 players',
    to: '/featured/the-wizards-gambit',
  },
  {
    server: 'Night Birds BotC',
    result: 'good' as const,
    title: 'Vigormortis keeps a dead army alive for five nights straight',
    desc: "The minions wouldn't die. Exorcist found the Demon on the very last possible night in an extraordinary comeback.",
    script: 'Bad Moon Rising · 14 players',
    to: '/featured/the-wizards-gambit',
  },
  {
    server: 'The Clocktower',
    result: 'evil' as const,
    title: 'Baron floods the town — four dead before day two ends',
    desc: 'Outsiders everywhere. The Drunk never found out what role they had been playing the whole time.',
    script: 'Trouble Brewing · 8 players',
    to: '/featured/the-wizards-gambit',
  },
] as const

const FEATURES = [
  { icon: '📋', name: 'Game Journal', body: 'Log every session — script, roles, players, outcome. A permanent, searchable record of every night in the town square.' },
  { icon: '📖', name: 'Storyboard', body: 'Night and day laid out in order. Watch any game back — nominations, kills, dawn — as it truly unfolded.' },
  { icon: '🏛️', name: 'Server Archive', body: 'Every game your group has ever played, in one place. New players can read through all the history before their first session.' },
  { icon: '📊', name: 'Player Chronicle', body: 'Win rates, alignment history, most-played roles. A profile that grows with every session logged.' },
  { icon: '🎭', name: 'Role Compendium', body: '200+ roles across all scripts, indexed by alignment and ability. Quick reference mid-game, first-night reminders for STs.' },
  { icon: '📸', name: 'Grimoire Scan', body: 'Photograph your grimoire. The Codex reads the tokens and logs the final state of any game automatically.' },
] as const

export function LandingPage() {
  const { user } = useAuth()
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set())
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

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

  const toggleFaq = (i: number) =>
    setOpenFaqs((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">

      {/* ── Header ── */}
      <Navbar fixed links={LANDING_NAV_LINKS}>
        {user ? (
          <Button size="sm" asChild>
            <Link to="/dashboard">Enter the Codex</Link>
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/login">Enter the Codex</Link>
            </Button>
          </>
        )}
      </Navbar>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-8 text-center sm:px-12 md:px-16">

        {/* Content */}
        <div className="relative z-10 w-full max-w-[640px] pb-16 pt-36 sm:pt-40">
          {/* Overline with flanking lines */}
          <div className="mb-6 flex items-center justify-center gap-3 sm:mb-8 sm:gap-5">
            <div className="h-px w-4 bg-primary/50 sm:w-8" />
            <span className="font-app-display text-[0.6rem] uppercase tracking-[0.22em] text-primary sm:text-[0.68rem] sm:tracking-[0.3em]">
              Blood on the Clocktower
            </span>
            <div className="h-px w-4 bg-primary/50 sm:w-8" />
          </div>

          {/* Title */}
          <h1
            className="font-app-display mb-4 font-semibold uppercase tracking-[0.04em] text-foreground"
            style={{ fontSize: 'clamp(1.5rem, 5vw, 3.4rem)', lineHeight: 1.05 }}
          >
            <span
              className="mb-1 block text-primary"
              style={{ fontSize: '0.65em', letterSpacing: '0.12em' }}
            >
              The Chronicle of
            </span>
            Ravenswood Bluff
          </h1>

          {/* Italic subtitle */}
          <p
            className="font-app-display mx-auto mb-10 max-w-[460px] italic leading-[1.6] text-muted-foreground"
            style={{ fontSize: 'clamp(0.85rem, 2vw, 1.08rem)' }}
          >
            Every game remembered. Every night logged. Every story told for those
            who were not there to witness it.
          </p>

          {/* CTAs */}
          <div className="mb-14 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link to="/login">Log your first game</Link>
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" asChild>
              <Link to="/featured/the-wizards-gambit">See the demo</Link>
            </Button>
          </div>

          {/* Divider with diamond */}
          <div className="mb-10 flex items-center gap-6">
            <div
              className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }}
            />
            <div className="h-3 w-3 shrink-0 rotate-45 bg-primary" />
            <div
              className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }}
            />
          </div>

          {/* Hero highlights */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            {[
              { n: 'Free forever', l: 'no paywalls or player limits' },
              { n: 'ST & Players', l: 'anyone in the group can log' },
              { n: 'All scripts', l: 'TB · S&V · BMR · custom' },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center gap-1">
                <span className="font-app-display text-[0.95rem] font-semibold text-primary sm:text-[1.1rem]">{s.n}</span>
                <span className="text-[0.63rem] uppercase tracking-[0.15em] text-muted-foreground/55">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Games — recently archived ── */}
      <section
        id="games"
        className={cn(
          'relative z-10 border-t border-border bg-card px-6 py-20 transition-all duration-700 md:px-12',
          revealed.has(0) ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        )}
        data-reveal="0"
      >
        {/* Gradient rule at very top */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.25 }}
        />

        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12 text-center">
            <p className="font-app-display mb-1 text-[0.65rem] uppercase tracking-[0.3em] text-primary">
              Recently archived
            </p>
            <h2 className="font-app-display text-[clamp(1.5rem,3vw,2.4rem)] font-semibold italic text-foreground">
              Games from the Chronicle
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
            {GAME_CARDS.map((card) => (
              <Link
                key={card.title}
                to={card.to}
                className="group relative overflow-hidden bg-card p-8 transition-colors hover:bg-background"
              >
                {/* Top shimmer on hover */}
                <div
                  aria-hidden
                  className="absolute left-0 right-0 top-0 h-px origin-center scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ background: 'linear-gradient(90deg, transparent, var(--primary), transparent)' }}
                />

                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="font-app-display text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground/50">
                    {card.server}
                  </span>
                  <span className={cn('game-badge shrink-0', card.result === 'evil' ? 'game-badge-evil' : 'game-badge-good')}>
                    {card.result === 'evil' ? 'Evil wins' : 'Good wins'}
                  </span>
                </div>

                <div className="font-app-display mb-2 text-[1.02rem] font-semibold leading-[1.3] text-foreground">
                  {card.title}
                </div>
                <p className="mb-6 text-[0.82rem] leading-[1.62] text-muted-foreground">
                  {card.desc}
                </p>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[0.62rem] italic text-muted-foreground/50">{card.script}</span>
                  <span className="text-[0.7rem] text-primary transition-colors group-hover:text-primary-hover">
                    Watch the game →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features — The Manuscripts ── */}
      <section
        id="features"
        className={cn(
          'relative z-10 border-t border-border bg-background px-6 py-20 transition-all duration-700 md:px-12',
          revealed.has(1) ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        )}
        data-reveal="1"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-14 text-center">
            <p className="font-app-display mb-1 text-[0.65rem] uppercase tracking-[0.3em] text-primary">
              The Manuscripts
            </p>
            <h2 className="font-app-display text-[clamp(1.5rem,3vw,2.4rem)] font-semibold italic text-foreground">
              What the Codex contains
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px bg-border border border-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.name}
                className="group relative overflow-hidden bg-background p-8 transition-colors hover:bg-card"
              >
                {/* Bottom fade line on hover */}
                <div
                  aria-hidden
                  className="absolute bottom-0 left-6 right-6 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: 'linear-gradient(90deg, transparent, var(--primary), transparent)' }}
                />

                {/* Icon box */}
                <div
                  className="mb-4 flex h-9 w-9 items-center justify-center border text-[0.95rem]"
                  style={{
                    background: 'rgba(155,29,32,0.07)',
                    borderColor: 'rgba(155,29,32,0.2)',
                  }}
                >
                  {f.icon}
                </div>

                <div className="font-app-display mb-2 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-primary">
                  {f.name}
                </div>
                <p className="text-[0.83rem] leading-[1.65] text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote ── */}
      <div
        className={cn(
          'relative z-10 overflow-hidden bg-primary px-6 py-20 text-center transition-all duration-700',
          revealed.has(2) ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        )}
        data-reveal="2"
      >
        {/* Shimmer rule top */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
        />
        {/* Shimmer rule bottom */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
        />

        {/* Diamond ornament */}
        <div className="mx-auto mb-6 flex h-16 w-16 rotate-45 items-center justify-center border border-white/25">
          <div className="h-2.5 w-2.5 -rotate-45 bg-white/80" />
        </div>

        <p
          className="font-app-display mx-auto max-w-[600px] italic leading-[1.35] text-white"
          style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}
        >
          "The town has no memory. The Codex does."
        </p>
        <div className="font-app-display mt-4 text-[0.6rem] uppercase tracking-[0.25em] text-white/55">
          From the preface
        </div>
      </div>

      {/* ── FAQ ── */}
      <section
        id="faq"
        className={cn(
          'relative z-10 border-t border-border bg-card px-6 py-16 transition-all duration-700 md:px-12 md:py-20',
          revealed.has(3) ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        )}
        data-reveal="3"
      >
        <div className="mx-auto max-w-[680px]">
          <p className="font-app-display mb-1 text-center text-[0.65rem] uppercase tracking-[0.3em] text-primary">
            Questions
          </p>
          <h2 className="font-app-display mb-10 text-center text-2xl font-semibold italic text-foreground">
            Frequently asked
          </h2>
          <div className="border-t-2 border-border">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={item.q}
                className="border-b-2 border-border"
                onClick={() => toggleFaq(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleFaq(i)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between gap-4 py-5">
                  <span className="text-sm text-foreground">{item.q}</span>
                  <span className={cn('shrink-0 text-xs text-primary transition-transform', openFaqs.has(i) && 'rotate-90')}>▶</span>
                </div>
                <div className={cn('overflow-hidden transition-[max-height] duration-300', openFaqs.has(i) ? 'max-h-48' : 'max-h-0')}>
                  <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        className={cn(
          'relative z-10 overflow-hidden border-t border-border px-6 py-24 text-center transition-all duration-700 md:py-32',
          revealed.has(4) ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        )}
        data-reveal="4"
      >
        {/* Circle decoration behind */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[400px] rounded-full border border-primary/6" />
        </div>

        <div className="relative z-10 mx-auto max-w-[580px]">
          <h2
            className="font-app-display mb-3 font-semibold uppercase tracking-[0.04em] text-foreground"
            style={{ fontSize: 'clamp(1.6rem, 3.5vw, 3rem)', lineHeight: 1.1 }}
          >
            Enter the <em className="not-italic text-primary">Codex</em>
          </h2>
          <p className="font-app-display mx-auto mb-10 italic leading-[1.65] text-muted-foreground" style={{ fontSize: '1.05rem' }}>
            Free for players and storytellers. Your first game logged in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/login">Sign up — it's free</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/featured/the-wizards-gambit">Browse the demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 flex flex-col gap-4 border-t border-border bg-background px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-6 md:px-12">
        {/* Gradient rule at top of footer */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.2 }}
        />
        <Link to="/" className="font-app-display text-[1.05rem] font-semibold text-foreground">
          BotC <em className="italic text-primary">Codex</em>
        </Link>
        <p className="text-center text-sm italic text-muted-foreground/80">Not affiliated with The Pandemonium Institute.</p>
        <p className="text-right text-sm text-muted-foreground/80">
          Built by <span className="font-medium text-foreground/90">koruto</span>
        </p>
      </footer>
    </div>
  )
}
