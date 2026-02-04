export function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-bold text-amber-500">Login</h1>
      <p className="mb-6 text-stone-400">Sign in or create an account.</p>
      <form className="flex flex-col gap-4 rounded-lg border border-stone-700 bg-stone-900/50 p-6">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-stone-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-stone-400">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded border border-stone-600 bg-stone-800 px-3 py-2 text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-amber-600 py-2 font-medium text-stone-900 hover:bg-amber-500"
        >
          Sign in
        </button>
        <p className="text-center text-sm text-stone-500">
          No account? <span className="text-amber-400">Sign up</span>
        </p>
      </form>
    </div>
  )
}
