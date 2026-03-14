import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { X, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/Button'
import { createFeedback } from '@/api/feedback'

const schema = z.object({
  type: z.enum(['bug', 'feature', 'general']),
  title: z.string().min(1, 'Title is required').max(100, 'Max 100 characters'),
  message: z.string().min(1, 'Message is required').max(1000, 'Max 1000 characters'),
})

type FormData = z.infer<typeof schema>

const TYPES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'general', label: 'General' },
] as const

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'general', title: '', message: '' },
  })

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setTimeout(() => {
        reset()
        setServerError(null)
        setSubmitted(false)
      }, 200)
    }
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      await createFeedback(data)
      setSubmitted(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl outline-none',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          )}
        >
          {submitted ? (
            <div className="flex flex-col items-center gap-1 pt-6 pb-2 text-center">
              <CheckCircle className="mb-1.5 size-10 text-primary" />
              <DialogPrimitive.Title className="text-sm font-medium text-foreground">
                Thanks for your feedback!
              </DialogPrimitive.Title>
              <p className="text-xs text-muted-foreground">
                We've received your message and will look into it.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-8"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                    Send Feedback
                  </DialogPrimitive.Title>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Report a bug, suggest a feature, or share a thought.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => handleOpenChange(false)}
                  className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {/* Type selector */}
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</span>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-background p-1">
                        {TYPES.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => field.onChange(value)}
                            className={cn(
                              'cursor-pointer rounded-md py-1.5 text-xs font-medium transition-colors',
                              field.value === value
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="feedback-title"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Title
                  </label>
                  <input
                    id="feedback-title"
                    type="text"
                    placeholder="Short summary…"
                    autoComplete="off"
                    {...register('title')}
                    className={cn(
                      'w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/15',
                      errors.title
                        ? 'border-destructive focus:border-destructive focus:ring-destructive/15'
                        : 'border-border',
                    )}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="feedback-message"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Message
                  </label>
                  <textarea
                    id="feedback-message"
                    rows={4}
                    placeholder="Describe the issue or idea…"
                    {...register('message')}
                    className={cn(
                      'w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/15',
                      errors.message
                        ? 'border-destructive focus:border-destructive focus:ring-destructive/15'
                        : 'border-border',
                    )}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
                  )}
                </div>

                {serverError && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {serverError}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                    {isSubmitting ? 'Sending…' : 'Send Feedback'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
