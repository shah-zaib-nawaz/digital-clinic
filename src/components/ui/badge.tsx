import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        // Clinical Appointment Status Badges
        held: 'border-[var(--color-status-held-border)] bg-[var(--color-status-held-bg)] text-[var(--color-status-held)] font-medium',
        pending:
          'border-[var(--color-status-pending-border)] bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending)] font-medium',
        confirmed:
          'border-[var(--color-status-confirmed-border)] bg-[var(--color-status-confirmed-bg)] text-[var(--color-status-confirmed)] font-medium',
        completed:
          'border-[var(--color-status-completed-border)] bg-[var(--color-status-completed-bg)] text-[var(--color-status-completed)] font-medium',
        cancelled:
          'border-[var(--color-status-cancelled-border)] bg-[var(--color-status-cancelled-bg)] text-[var(--color-status-cancelled)] font-medium',
        noshow:
          'border-[var(--color-status-noshow-border)] bg-[var(--color-status-noshow-bg)] text-[var(--color-status-noshow)] font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
