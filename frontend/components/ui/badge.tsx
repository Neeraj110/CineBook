import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Cinematic Obsidian Badge System
 * - Rectangular 4px radius (never pill except live-dot)
 * - Status badges: tinted bg + matching text, 1px tinted border
 * - Never color-only — pair with shape/icon indicator
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] border transition-colors rounded-[4px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-primary border-primary/30",

        secondary:
          "bg-surface-elevated text-surface-foreground border-border",

        outline:
          "bg-transparent text-foreground border-border",

        /** Format badges — IMAX, DOLBY, 4DX etc */
        format:
          "bg-surface-elevated text-gold border-gold/30 text-[10px]",

        /** Cinema pass / premiere badges */
        premiere:
          "bg-primary/10 text-primary border-primary/40",

        // ── Status badges with geometric accessibility ──
        confirmed:
          "bg-[rgba(16,185,129,0.1)] text-[#10b981] border-[rgba(16,185,129,0.3)]",

        pending:
          "bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border-[rgba(245,158,11,0.3)]",

        cancelled:
          "bg-[rgba(239,68,68,0.1)] text-[#ef4444] border-[rgba(239,68,68,0.3)]",

        expired:
          "bg-[rgba(100,116,139,0.1)] text-[#64748b] border-[rgba(100,116,139,0.3)]",

        refunded:
          "bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border-[rgba(59,130,246,0.3)]",

        success:
          "bg-[rgba(16,185,129,0.1)] text-[#10b981] border-[rgba(16,185,129,0.3)]",

        destructive:
          "bg-[rgba(239,68,68,0.1)] text-[#ef4444] border-[rgba(239,68,68,0.3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };

