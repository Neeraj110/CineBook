import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Cinematic Obsidian Input
 * - Surface: #15161B bg, #282A33 border
 * - Focused: border shifts to #FF4425 + inline ring
 * - Placeholder: #64748B muted slate
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[8px]",
          "bg-surface border border-border",
          "px-4 py-2 text-sm text-foreground",
          "placeholder:text-muted",
          "transition-all duration-150",
          "focus:outline-none focus:border-primary focus:[box-shadow:0_0_0_1px_#ff4425]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Date/time inputs
          "[color-scheme:dark]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

