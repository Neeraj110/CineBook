import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Cinematic Obsidian Button System
 * - Primary: Marquee Vermilion (#FF4425), 8px radius, glow on hover
 * - Secondary/Ghost: translucent dark, #282A33 border
 * - Destructive: red border outline → filled on confirmation
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "text-sm font-semibold tracking-wide",
    "rounded-[8px]",                          // Design spec: strict 8px, no pill
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Primary CTA — Marquee Vermilion with projection glow */
        default: [
          "bg-primary text-white",
          "hover:bg-primary-hover",
          "hover:[box-shadow:0_0_16px_rgba(255,68,37,0.4)]",
        ].join(" "),

        /** Destructive — border-only, fills on hover */
        destructive: [
          "border border-status-cancelled/40 text-status-cancelled bg-transparent",
          "hover:bg-status-cancelled hover:text-white hover:border-status-cancelled",
        ].join(" "),

        /** Ghost outline — dark translucent */
        outline: [
          "border border-border bg-surface/60 text-foreground",
          "hover:border-border-bright hover:bg-surface-elevated",
        ].join(" "),

        /** Secondary — solid dark surface */
        secondary: [
          "bg-surface-elevated border border-border text-foreground",
          "hover:border-border-bright hover:bg-[rgba(255,255,255,0.08)]",
        ].join(" "),

        /** Ghost — no border */
        ghost: [
          "bg-transparent text-foreground",
          "hover:bg-[rgba(255,255,255,0.06)] hover:text-foreground",
        ].join(" "),

        link: "text-primary underline-offset-4 hover:underline bg-transparent p-0 h-auto",
      },
      size: {
        sm:      "h-8 px-3 text-xs rounded-[6px]",
        default: "h-11 px-5",           // 44px desktop standard
        lg:      "h-12 px-7 text-base", // 48px mobile checkout
        icon:    "h-10 w-10 rounded-[8px]",
        "icon-sm": "h-8 w-8 rounded-[6px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

