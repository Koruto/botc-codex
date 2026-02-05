import { Link, useParams } from 'react-router-dom'

export function ServerPage() {
  const { serverId } = useParams()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-500">
            Server: {serverId ?? 'Unknown'}
          </h1>
          <p className="text-stone-400">Games in this server. Admin can add or edit.</p>
        </div>
        <Link
          to={`/server/${serverId}/add-game`}
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-500"
        >
          Add game
        </Link>
      </div>
      <section className="rounded-lg border border-stone-700 bg-stone-900/50 p-6">
        <h2 className="mb-4 text-lg font-medium text-stone-200">Games</h2>
        <ul className="space-y-3">
          <li className="flex items-center justify-between rounded border border-stone-700 p-3">
            <Link to="/game/wizard-game" className="text-amber-400 hover:underline">
              The Wizard's Gambit — 6 players — Feb 2025
            </Link>
            <span className="text-xs text-stone-500">Admin</span>
          </li>
          <li className="flex items-center justify-between rounded border border-stone-700 p-3">
            <Link to="/game/trouble-brewing-feb-2025" className="text-amber-400 hover:underline">
              Trouble Brewing — 7 players — 1 Feb 2025
            </Link>
            <span className="text-xs text-stone-500">Viewer</span>
          </li>
          <li className="flex items-center justify-between rounded border border-stone-700 p-3">
            <Link to="/game/bad-moon-rising-jan-2025" className="text-amber-400 hover:underline">
              Bad Moon Rising — 9 players — 28 Jan 2025
            </Link>
            <span className="text-xs text-stone-500">Viewer</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
