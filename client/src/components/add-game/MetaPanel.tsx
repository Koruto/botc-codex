import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { DerivedGame } from '@/types'
import { DatePicker } from '@/components/ui/date-picker'

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
  playerCount: z
    .number({ error: 'Required' })
    .int('Must be a whole number')
    .min(5, 'Min 5 players')
    .max(20, 'Max 20 players'),
  storyteller: z.string().min(1, 'Storyteller is required'),
})

export type MetaFormValues = z.infer<typeof metaSchema>

export type MetaPanelProps = {
  defaultValues?: Partial<MetaFormValues>
  saving: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  derivedGame: DerivedGame | null
  onBack: () => void
  onSave: (data: MetaFormValues) => void | Promise<void>
  onSaveAndNext: (data: MetaFormValues) => void | Promise<void>
  onShowPreview: () => void
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
  saveStatus,
  derivedGame,
  onBack,
  onSave,
  onSaveAndNext,
  onShowPreview,
}: MetaPanelProps) {
  const resolvedDefaults: Partial<MetaFormValues> = {
    gameName: '',
    title: '',
    subtitle: '',
    playedOn: '',
    edition: 'tb',
    playerCount: 0,
    storyteller: '',
    ...defaultValues,
  }
  if (resolvedDefaults.edition === undefined || resolvedDefaults.edition === '' || !EDITION_OPTIONS.some((o) => o.id === resolvedDefaults.edition)) {
    resolvedDefaults.edition = 'tb'
  }

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MetaFormValues>({
    resolver: zodResolver(metaSchema),
    defaultValues: resolvedDefaults,
  })

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

          <FormField label="Script / edition" error={errors.edition?.message}>
            <select
              {...register('edition')}
              className={inputClass}
            >
              {EDITION_OPTIONS.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Player count" error={errors.playerCount?.message}>
            <input
              {...register('playerCount', { valueAsNumber: true })}
              type="number"
              min={5}
              max={20}
              className={inputClass}
            />
          </FormField>

          <FormField label="Storyteller" error={errors.storyteller?.message}>
            <input
              {...register('storyteller')}
              type="text"
              placeholder="e.g. Ele"
              className={inputClass}
            />
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
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded border border-input px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSave)}
            disabled={saving}
            className="rounded border border-primary px-4 py-2 text-sm text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save & continue'}
          </button>
          {derivedGame && (
            <button
              type="button"
              onClick={onShowPreview}
              className="rounded border border-primary px-4 py-2 text-sm text-primary hover:bg-primary/10"
            >
              Preview full page
            </button>
          )}
          {saveStatus === 'saved' && <span className="text-sm text-green-400">Draft saved</span>}
        </div>
      </section>
    </form>
  )
}
