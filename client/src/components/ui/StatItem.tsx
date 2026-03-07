import { cn } from '@/lib/utils'

interface StatItemProps {
  value: string | number
  label: string
  /** Render the value in placeholder/faint colour */
  faint?: boolean
}

export function StatItem({ value, label, faint = false }: StatItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cn('font-app-display text-3xl font-semibold leading-none', faint ? 'text-placeholder' : 'text-foreground')}>
        {value}
      </span>
      <span className="text-xs font-medium tracking-widest uppercase text-placeholder">
        {label}
      </span>
    </div>
  )
}
