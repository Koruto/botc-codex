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
            'inline-flex w-full items-center justify-start gap-2 rounded border border-stone-600 bg-stone-800 px-3 py-2 text-left text-sm text-stone-100 transition-colors placeholder-stone-500 hover:bg-stone-700/80 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30',
            !value && 'text-stone-500',
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-stone-400" />
          <span>{date ? format(date, 'PPP') : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto border-stone-700 bg-stone-900 p-0 shadow-xl"
        align="start"
      >
        <div
          className={cn(
            'rounded-md',
            '[&_button]:text-stone-200',
            '[&_button:hover]:bg-stone-700 [&_button:hover]:text-stone-100',
            '[&_button[data-selected-single=true]]:bg-amber-600 [&_button[data-selected-single=true]]:text-stone-900',
            '[&_.rdp-today_button]:bg-stone-700 [&_.rdp-today_button]:text-stone-100',
            '[&_[class*="today"]_button]:bg-stone-700 [&_[class*="today"]_button]:text-stone-100',
            '**:[[class*="caption_label"]]:text-stone-200',
            '**:[[class*="weekday"]]:text-stone-500'
          )}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : '')}
            className="border-0 bg-transparent p-3 text-stone-200"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
