import { format, parseISO, isValid } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

export type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

function parseValue(s: string): Date | undefined {
  if (!s?.trim()) return undefined
  const iso = parseISO(s)
  if (isValid(iso)) return iso
  const d = new Date(s)
  return isValid(d) ? d : undefined
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  id,
}: DatePickerProps) {
  const date = parseValue(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            'inline-flex w-full items-center justify-start gap-2 rounded border border-input bg-background px-3 py-2 text-left text-sm text-foreground transition-colors placeholder-muted-foreground hover:bg-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span>{date ? format(date, 'PPP') : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto border-border bg-card p-0 shadow-xl"
        align="start"
      >
        <div
          className={cn(
            'rounded-md [&_button]:text-foreground',
            '[&_button:hover]:bg-muted [&_button:hover]:text-foreground',
            '[&_button[data-selected-single=true]]:bg-primary [&_button[data-selected-single=true]]:text-primary-foreground',
            '[&_.rdp-today_button]:bg-muted [&_.rdp-today_button]:text-foreground',
            '[&_[class*="today"]_button]:bg-muted [&_[class*="today"]_button]:text-foreground',
            '**:[[class*="caption_label"]]:text-foreground',
            '**:[[class*="weekday"]]:text-muted-foreground'
          )}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : '')}
            captionLayout="dropdown"
            className="border-0 bg-transparent p-3 text-foreground"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
