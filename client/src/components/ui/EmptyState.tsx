interface EmptyStateProps {
  icon: string
  title: string
  body: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="text-center px-6 py-14">
      <div className="text-3xl mb-3 opacity-40">{icon}</div>
      <p className="text-sm font-medium text-foreground mb-1.5">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto mb-3">{body}</p>
      {action}
    </div>
  )
}
