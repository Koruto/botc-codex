import { useParams, Link } from 'react-router-dom'

export function AddGamePage() {
  const { serverId } = useParams()

  return (
    <div>
      <div className="mb-6">
        <Link
          to={`/server/${serverId}`}
          className="text-sm text-amber-400 hover:underline"
        >
          ← Back to server
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-amber-500">Add game</h1>
        <p className="text-stone-400">
          Upload a grimoire image, then name and save to this server.
        </p>
      </div>
      <section className="rounded-lg border border-stone-700 bg-stone-900/50 p-6">
        <h2 className="mb-4 text-lg font-medium text-stone-200">Upload grimoire</h2>
        <div className="flex flex-col items-center justify-center rounded border-2 border-dashed border-stone-600 py-12 text-stone-500">
          <p className="mb-2">Drag and drop an image here, or click to select.</p>
          <p className="text-sm">Supports: PNG, JPG</p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-stone-400">Script / name</label>
            <input
              type="text"
              placeholder="e.g. Trouble Brewing"
              className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-stone-100 placeholder-stone-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-400">Date played</label>
            <input
              type="date"
              className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-stone-100"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-500"
          >
            Process & preview
          </button>
          <button
            type="button"
            className="rounded border border-stone-600 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-800"
          >
            Cancel
          </button>
        </div>
      </section>
    </div>
  )
}
