import * as React from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'logout'
export type ButtonSize = 'sm' | 'default' | 'lg' | 'xl' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Render as the child element instead of <button>, useful for <Link> wrappers */
  asChild?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-primary-sm hover:bg-primary-hover hover:shadow-primary-md hover:-translate-y-px active:translate-y-0',
  secondary:
    'bg-card text-foreground border border-warm-border hover:border-foreground hover:bg-secondary',
  ghost:
    'bg-transparent text-primary border border-border hover:border-primary/14 hover:bg-primary/8',
  logout:
    'bg-transparent text-muted-foreground border border-border hover:text-foreground hover:border-warm-border',
}

const sizes: Record<ButtonSize, string> = {
  sm:      'py-1.5 px-3 text-xs',
  default: 'py-2 px-4 text-sm',
  lg:      'py-2.5 px-6 text-sm',
  xl:      'py-3 px-8 text-base w-full',
  icon:    'size-9 p-0',
}

export function buttonVariants({ variant = 'primary', size = 'default' }: { variant?: ButtonVariant; size?: ButtonSize } = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-1.5 font-medium rounded-[7px] cursor-pointer transition-all duration-150 whitespace-nowrap no-underline select-none disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
  )
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'primary', size = 'default', asChild = false, className, ...props }, ref) {
    const Comp = asChild ? Slot.Root : 'button'
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
