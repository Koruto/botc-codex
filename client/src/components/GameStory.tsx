import type { GameStoryPhase } from '../types/game'

interface GameStoryProps {
  title: string
  subtitle: string
  meta: string
  phases: GameStoryPhase[]
  registerPhaseRef?: (index: number, el: HTMLElement | null) => void
}

export function GameStory({ title, subtitle, meta, phases, registerPhaseRef }: GameStoryProps) {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-12 md:px-12 md:py-16">
      <header className="mb-16">
        <h1 className="font-game-display text-3xl font-semibold tracking-tight text-game-text">
          {title}
        </h1>
        <p className="mt-3 font-game-ui text-lg leading-relaxed text-game-text-secondary">
          {subtitle}
        </p>
        <p className="mt-4 font-game-ui text-sm text-game-text-muted">
          {meta}
        </p>
      </header>

      {phases.map((phase, i) => (
        <section
          key={`${phase.title}-${i}`}
          ref={(el) => registerPhaseRef?.(i, el)}
          className="mb-10 md:mb-20"
        >
          <>
            <h2 className="font-game-display text-xl font-semibold text-game-text">
              {phase.title}
            </h2>
            <p className="mt-1 text-sm text-game-text-muted">
              {phase.subtitle}
            </p>
          </>
          {phase.events.map((event) => (
            <div
              key={event.label}
              className="border-l-2 border-game-accent/40 pl-5 py-3 my-4"
            >
              <div className="font-game-ui text-[11px] font-medium uppercase tracking-widest text-game-text-muted mb-1">
                {event.label}
              </div>
              <p className="text-game-text-secondary leading-[1.75]">
                {event.body}
              </p>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
