import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-primary">Dashboard</h1>
      <p className="mb-6 text-muted-foreground">
        Your servers and recent games. Join a server or start from here.
      </p>
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium text-foreground">My servers</h2>
        <ul className="space-y-2">
          <li>
            <Link to="/server/tuesday-group" className="text-primary hover:underline">
              Tuesday group
            </Link>
          </li>
          <li>
            <Link to="/server/league-x" className="text-primary hover:underline">
              League X
            </Link>
          </li>
        </ul>
        <Button type="button" className="mt-4">
          Join server
        </Button>
      </section>
      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium text-foreground">Recent games</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link to="/game/the-beginning" className="text-primary hover:underline">
              The Beginning — April 2023
            </Link>
          </li>
          <li>
            <Link to="/game/wizard-game" className="text-primary hover:underline">
              The Wizard's Gambit — Feb 2025
            </Link>
          </li>
          <li>
            <Link to="/game/trouble-brewing-feb-2025" className="text-primary hover:underline">
              Trouble Brewing — 1 Feb 2025
            </Link>
          </li>
          <li>
            <Link to="/game/bad-moon-rising-jan-2025" className="text-primary hover:underline">
              Bad Moon Rising — 28 Jan 2025
            </Link>
          </li>
        </ul>
      </section>
    </div>
  )
}
