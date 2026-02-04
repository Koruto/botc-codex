export function ProfilePage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold text-amber-500">Profile & settings</h1>
      <p className="mb-6 text-stone-400">
        Account details and display preferences.
      </p>
      <section className="rounded-lg border border-stone-700 bg-stone-900/50 p-6">
        <h2 className="mb-4 text-lg font-medium text-stone-200">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-stone-400">Email</label>
            <input
              type="email"
              defaultValue="you@example.com"
              className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-stone-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-400">
              Change password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-stone-100 placeholder-stone-500"
            />
          </div>
        </div>
        <button
          type="button"
          className="mt-4 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-500"
        >
          Save changes
        </button>
      </section>
      <section className="mt-6 rounded-lg border border-stone-700 bg-stone-900/50 p-6">
        <h2 className="mb-4 text-lg font-medium text-stone-200">Preferences</h2>
        <p className="text-sm text-stone-500">
          Default POV, reduce motion, and other display options can go here.
        </p>
      </section>
    </div>
  )
}
