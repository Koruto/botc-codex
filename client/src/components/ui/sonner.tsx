import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast !bg-card !text-foreground !border !border-border !rounded-[10px] !shadow-[var(--shadow-card)] font-sans text-sm',
          description: '!text-muted-foreground text-sm',
          actionButton:
            '!bg-primary !text-primary-foreground !rounded-md text-sm font-medium',
          cancelButton:
            '!bg-muted !text-muted-foreground !rounded-md text-sm',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
