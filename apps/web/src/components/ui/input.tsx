import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border-[1.5px] border-[color:var(--color-border)] bg-white/70 px-4 py-2 text-sm text-[color:var(--color-ink)]",
          "placeholder:text-[color:var(--color-muted-foreground)]",
          "transition-colors duration-150",
          "hover:border-[color:var(--color-border-strong)]",
          "focus-visible:outline-none focus-visible:border-[color:var(--color-saffron)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-saffron)]/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
