interface GameTimelineProps {
  labels: string[]
  activeIndex: number
  onBeatClick: (index: number) => void
}

export function GameTimeline({ labels, activeIndex, onBeatClick }: GameTimelineProps) {
  return (
    <aside
      className="game-timeline fixed left-0 top-0 z-1000 flex h-screen w-14 flex-col border-r border-game-border-subtle bg-transparent sm:w-[140px]"
      aria-label="Timeline"
    >
      <div className="relative flex h-full flex-col justify-between py-8">
        {/* Single line behind the dots; dots use opaque fill so the line doesn’t show through */}
        <div
          className="absolute left-[12.5px] top-8 bottom-8 w-px bg-game-border sm:left-[20.5px]"
          aria-hidden
        />
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onBeatClick(i)}
            aria-label={`Jump to ${label}`}
            aria-current={i === activeIndex ? 'true' : undefined}
            className="group relative z-10 flex cursor-pointer items-center gap-3 rounded-md px-2 py-1 text-left sm:px-4"
          >
            <span
              className={`game-timeline-dot flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full ${i === activeIndex
                ? 'bg-game-accent shadow-[0_0_0_2px_var(--color-game-bg)]'
                : 'border-2 border-game-border bg-game-bg group-hover:border-game-accent'
                }`}
            />
            <span
              className={`hidden font-game-ui text-xs sm:inline ${i === activeIndex
                ? 'font-medium text-game-text'
                : 'text-game-text-muted group-hover:font-medium group-hover:text-game-text'
                }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
