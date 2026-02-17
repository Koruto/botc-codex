import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-amber-500">Dashboard</h1>
      <p className="mb-6 text-stone-400">
        Your servers and recent games. Join a server or start from here.
      </p>
      <section className="rounded-lg border border-stone-700 bg-stone-900/50 p-6">
        <h2 className="mb-4 text-lg font-medium text-stone-200">My servers</h2>
        <ul className="space-y-2">
          <li>
            <Link
              to="/server/tuesday-group"
              className="text-amber-400 hover:underline"
            >
              Tuesday group
            </Link>
          </li>
          <li>
            <Link to="/server/league-x" className="text-amber-400 hover:underline">
              League X
            </Link>
          </li>
        </ul>
        <button
          type="button"
          className="mt-4 rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-stone-900 hover:bg-amber-500"
        >
          Join server
        </button>
      </section>
      <section className="mt-6 rounded-lg border border-stone-700 bg-stone-900/50 p-6">
        <h2 className="mb-4 text-lg font-medium text-stone-200">Recent games</h2>
        <ul className="space-y-2 text-stone-400">
          <li>
            <Link to="/game/the-beginning" className="text-amber-400 hover:underline">
              The Beginning — April 2023
            </Link>
          </li>
          <li>
            <Link to="/game/wizard-game" className="text-amber-400 hover:underline">
              The Wizard's Gambit — Feb 2025
            </Link>
          </li>
          <li>
            <Link to="/game/trouble-brewing-feb-2025" className="text-amber-400 hover:underline">
              Trouble Brewing — 1 Feb 2025
            </Link>
          </li>
          <li>
            <Link to="/game/bad-moon-rising-jan-2025" className="text-amber-400 hover:underline">
              Bad Moon Rising — 28 Jan 2025
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
