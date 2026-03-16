"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

export type SelectOption = {
  value: string
  label: string
}

export type SelectComboboxProps = {
  options: SelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Use "sm" for compact table/inline contexts (h-8, rounded-sm, text-xs) */
  size?: "default" | "sm"
}

/**
 * A single-select combobox that works with value/label pairs.
 * Internally converts between display labels and stored values so callers
 * only deal with plain ids.
 * Memoized so it only re-renders when props (options, value, onValueChange, etc.) change by reference.
 */
export const SelectCombobox = memo(function SelectCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  className,
  size = "default",
}: SelectComboboxProps) {
  const currentLabel = options.find((o) => o.value === value)?.label ?? (value || "")

  function handleChange(label: string | null) {
    const l = label ?? ""
    if (!l) {
      onValueChange("")
      return
    }
    const match = options.find((o) => o.label === l)
    if (match) {
      onValueChange(match.value)
    }
  }

  return (
    <Combobox value={currentLabel} onValueChange={handleChange}>
      <ComboboxInput
        placeholder={placeholder}
        showTrigger
        className={cn(
          size === "sm" && "h-8 rounded-sm text-xs",
          className,
        )}
      />
      <ComboboxContent>
        <ComboboxList>
          {options.map((opt) => (
            <ComboboxItem key={opt.value} value={opt.label}>
              {opt.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
})
