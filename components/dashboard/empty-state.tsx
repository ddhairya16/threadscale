import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onClick?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onClick
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-card/20 min-h-[250px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      
      {(actionLabel && actionHref) && (
        <Link href={actionHref}>
          <Button variant="default" className="shadow-sm">
            {actionLabel}
          </Button>
        </Link>
      )}
      
      {(actionLabel && onClick) && (
        <Button onClick={onClick} variant="default" className="shadow-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
