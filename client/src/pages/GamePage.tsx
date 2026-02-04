import { useParams } from 'react-router-dom'

export function GamePage() {
  const { gameId } = useParams()

  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1">
        <h1 className="mb-2 text-2xl font-bold text-amber-500">
          Game {gameId ?? 'Unknown'}
        </h1>
        <p className="mb-6 text-stone-400">
          Scroll-driven timeline. Grimoire updates as you scroll.
        </p>
        <section className="space-y-4 rounded-lg border border-stone-700 bg-stone-900/50 p-6">
          <div className="border-l-2 border-amber-500 pl-4">
            <p className="text-sm text-stone-500">Day 1</p>
            <p className="text-stone-200">Alice nominated Bob — 4 votes — executed.</p>
          </div>
          <div className="border-l-2 border-stone-600 pl-4">
            <p className="text-sm text-stone-500">Night 1</p>
            <p className="text-stone-200">Empath got 2. Grimoire updated.</p>
          </div>
          <div className="border-l-2 border-stone-600 pl-4">
            <p className="text-sm text-stone-500">Day 2</p>
            <p className="text-stone-200">Carol nominated Dave — 3 votes — no execution.</p>
          </div>
        </section>
        <button
          type="button"
          className="mt-4 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-500"
        >
          Copy Town Square JSON
        </button>
      </div>
      <aside className="w-64 shrink-0 rounded-lg border border-stone-700 bg-stone-900/50 p-4">
        <h2 className="mb-3 text-sm font-medium text-stone-400">Grimoire</h2>
        <div className="aspect-square rounded bg-stone-800 flex items-center justify-center text-stone-500 text-sm">
          [Grimoire image]
        </div>
        <p className="mt-2 text-xs text-stone-500">POV: Omniscient</p>
      </aside>
    </div>
  )
}
