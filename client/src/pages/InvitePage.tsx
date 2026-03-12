import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getInvite, joinServer } from '@/api/servers'
import type { InviteInfo } from '@/types/api.types'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/Button'

export function InvitePage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const { user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [alreadyMember, setAlreadyMember] = useState(false)

  useEffect(() => {
    if (!inviteCode) return
    const load = async () => {
      try {
        const invite = await getInvite(inviteCode)
        setInvite(invite)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid invite link')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [inviteCode])

  const handleJoin = async () => {
    if (!inviteCode) return
    setJoinError(null)
    setJoining(true)
    try {
      const res = await joinServer(inviteCode)
      if (res.alreadyMember) {
        setAlreadyMember(true)
      } else {
        navigate(`/servers/${res.serverId}`)
      }
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join server')
    } finally {
      setJoining(false)
    }
  }

  if (loading || authLoading) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  if (error || !invite) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <p className="mb-4 text-destructive">{error ?? 'Invite not found.'}</p>
        <Button asChild variant="secondary">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    )
  }

  if (alreadyMember) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <h1 className="mb-2 text-xl font-bold text-primary">{invite.name}</h1>
        <p className="mb-4 text-muted-foreground">You're already a member of this server.</p>
        <Button asChild>
          <Link to={`/servers/${invite.serverId}`}>Go to server</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          You've been invited to
        </p>
        <h1 className="mb-6 text-2xl font-bold text-primary">{invite.name}</h1>

        {user ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.username}</span>.
            </p>
            {joinError && (
              <p className="mb-3 text-sm text-destructive">{joinError}</p>
            )}
            <Button onClick={handleJoin} disabled={joining} className="w-full">
              {joining ? 'Joining…' : `Join ${invite.name}`}
            </Button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Sign in or create a free account to join this server.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link to={`/login?redirect=/invite/${inviteCode}`}>Sign in to join</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <Link to={`/login?tab=signup&redirect=/invite/${inviteCode}`}>
                  Create account
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
