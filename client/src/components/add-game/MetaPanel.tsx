import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { DerivedGame } from '@/types'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/Button'

const EDITION_OPTIONS = [
  { id: 'tb', label: 'Trouble Brewing' },
  { id: 'bmr', label: 'Bad Moon Rising' },
  { id: 'snv', label: 'Sects & Violets' },
  { id: 'custom', label: 'Custom Script / Characters' },
] as const

const metaSchema = z.object({
  gameName: z.string(),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string(),
  playedOn: z.string().min(1, 'Date played is required'),
  edition: z.string().min(1, 'Edition is required'),
  winner: z.enum(['', 'good', 'evil']).optional(),
})

export type MetaFormValues = z.infer<typeof metaSchema>

export type MetaPanelProps = {
  defaultValues?: Partial<MetaFormValues>
  saving: boolean
  derivedGame: DerivedGame | null
  edition?: string
  onBack: () => void
  onSave: (data: MetaFormValues) => void | Promise<void>
  onSaveAndNext: (data: MetaFormValues) => void | Promise<void>
}

const inputClass =
  'w-full rounded border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted-foreground">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function MetaPanel({
  defaultValues,
  saving,
  onBack,
  onSave,
  onSaveAndNext,
}: MetaPanelProps) {
  const resolvedDefaults: Partial<MetaFormValues> = {
    gameName: '',
    title: '',
    subtitle: '',
    playedOn: '',
    edition: 'tb',
    winner: '',
    ...defaultValues,
  }
  if (resolvedDefaults.edition === undefined || resolvedDefaults.edition === '' || !EDITION_OPTIONS.some((o) => o.id === resolvedDefaults.edition)) {
    resolvedDefaults.edition = 'tb'
  }

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<MetaFormValues>({
    resolver: zodResolver(metaSchema),
    defaultValues: resolvedDefaults,
  })
  const currentEdition = watch('edition')

  return (
    <form onSubmit={handleSubmit(onSaveAndNext)}>
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium text-foreground">Meta</h2>

        <FormField
          label="Game name"
          hint="Used to identify this game in the list (stored in JSON)."
        >
          <input
            {...register('gameName')}
            type="text"
            placeholder="e.g. tuesday-bmr-feb-2025"
            className={inputClass}
          />
        </FormField>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Date played" error={errors.playedOn?.message}>
            <Controller
              name="playedOn"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Pick a date"
                />
              )}
            />
          </FormField>

          <FormField label="Script / edition" error={errors.edition?.message} hint={currentEdition === 'custom' ? 'Define your custom script and roles in the Import step next.' : undefined}>
            <select
              {...register('edition')}
              className={inputClass}
            >
              {EDITION_OPTIONS.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="mt-4 grid gap-4">
          <FormField label="Game title" error={errors.title?.message}>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. The Beginning"
              className={inputClass}
            />
          </FormField>

          <FormField label="Subtitle (optional)">
            <input
              {...register('subtitle')}
              type="text"
              placeholder="e.g. Eleven in the dark..."
              className={inputClass}
            />
          </FormField>

          <FormField label="Who won?" hint="Shown on game cards and in the storyboard.">
            <select {...register('winner')} className={inputClass}>
              <option value="">Not set</option>
              <option value="good">Good wins</option>
              <option value="evil">Evil wins</option>
            </select>
          </FormField>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" variant="ghost" onClick={onBack} disabled={saving}>
            ← Back
          </Button>
          <Button type="button" variant="secondary" onClick={handleSubmit(onSave)} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save & Continue →'}
          </Button>
        </div>
      </section>
    </form>
  )
}
