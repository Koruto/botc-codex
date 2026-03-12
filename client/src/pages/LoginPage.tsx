import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

const signupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be 32 characters or fewer')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, digits, hyphens, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>
type SignupFormData = z.infer<typeof signupSchema>

export function LoginPage() {
  const { user, login, signup } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'
  const [tab, setTab] = useState<'login' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  )
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true })
  }, [user, navigate, redirectTo])

  const {
    register: regLogin,
    handleSubmit: handleLogin,
    formState: { errors: loginErrors, isSubmitting: loginSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const {
    register: regSignup,
    handleSubmit: handleSignup,
    formState: { errors: signupErrors, isSubmitting: signupSubmitting },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) })

  const onLogin = async (data: LoginFormData) => {
    setServerError(null)
    try {
      await login(data.username, data.password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const onSignup = async (data: SignupFormData) => {
    setServerError(null)
    try {
      await signup(data.username, data.password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Sign up failed')
    }
  }

  return (
    <div className="mx-auto max-w-[420px] py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="app-page-title">
          {tab === 'login' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back to the Codex.</p>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 bg-secondary border border-border rounded-[8px] p-[3px] mb-6">
        {(['login', 'signup'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setServerError(null) }}
            className={cn(
              'py-2 text-sm text-center rounded-[6px] cursor-pointer transition-all duration-150 border-0 outline-none',
              tab === t
                ? 'bg-card text-foreground font-medium shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mb-4 rounded-[7px] border border-primary/30 bg-[rgba(155,29,32,0.06)] px-3 py-2 text-sm text-primary">
          {serverError}
        </div>
      )}

      {/* Form card */}
      <div className="bg-card border border-border rounded-[10px] shadow-[0_4px_16px_rgba(28,20,16,0.08),0_1px_4px_rgba(28,20,16,0.04)] dark:shadow-[0_2px_0_rgba(210,110,90,0.18),0_8px_40px_rgba(0,0,0,0.6)] p-7">
        {tab === 'login' ? (
          <form onSubmit={handleLogin(onLogin)}>
            <div className="mb-4">
              <label htmlFor="login-username" className="block text-sm font-medium text-foreground mb-1.5">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                placeholder="Your username"
                {...regLogin('username')}
                className="app-input w-full"
              />
              {loginErrors.username && (
                <p className="mt-1 text-xs text-destructive">{loginErrors.username.message}</p>
              )}
            </div>
            <div className="mb-6">
              <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...regLogin('password')}
                className="app-input w-full"
              />
              {loginErrors.password && (
                <p className="mt-1 text-xs text-destructive">{loginErrors.password.message}</p>
              )}
            </div>
            <Button type="submit" size="xl" disabled={loginSubmitting}>
              {loginSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup(onSignup)}>
            <div className="mb-4">
              <label htmlFor="signup-username" className="block text-sm font-medium text-foreground mb-1.5">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                autoComplete="username"
                placeholder="your_username"
                {...regSignup('username')}
                className="app-input w-full"
              />
              {signupErrors.username && (
                <p className="mt-1 text-xs text-destructive">{signupErrors.username.message}</p>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                Letters, digits, hyphens, underscores. Cannot be changed later.
              </p>
            </div>
            <div className="mb-6">
              <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="at least 8 characters"
                {...regSignup('password')}
                className="app-input w-full"
              />
              {signupErrors.password && (
                <p className="mt-1 text-xs text-destructive">{signupErrors.password.message}</p>
              )}
            </div>
            <Button type="submit" size="xl" disabled={signupSubmitting}>
              {signupSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              No email required.{' '}
              <Link to="/login" className="text-primary hover:underline">
                You can add one later
              </Link>{' '}
              for account recovery.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
