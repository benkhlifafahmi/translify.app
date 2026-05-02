import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-150 ease-out " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-saffron)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-paper)] " +
    "disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--color-ink)] text-[color:var(--color-primary-foreground)] " +
          "shadow-[0_2px_0_rgba(20,16,8,0.4),0_8px_18px_-8px_rgba(20,16,8,0.5)] " +
          "hover:shadow-[0_3px_0_rgba(20,16,8,0.45),0_12px_22px_-8px_rgba(20,16,8,0.55)] hover:-translate-y-[1px]",
        accent:
          "bg-[color:var(--color-saffron)] text-[color:var(--color-accent-foreground)] " +
          "shadow-[0_2px_0_rgba(140,90,30,0.45),0_8px_18px_-8px_rgba(200,137,62,0.6)] " +
          "hover:bg-[color:var(--color-saffron-deep)] hover:-translate-y-[1px]",
        sage:
          "bg-[color:var(--color-sage)] text-white " +
          "shadow-[0_2px_0_rgba(60,90,60,0.4),0_8px_18px_-8px_rgba(95,135,99,0.55)] " +
          "hover:bg-[color:var(--color-sage-deep)] hover:-translate-y-[1px]",
        outline:
          "border-[1.5px] border-[color:var(--color-border-strong)] bg-[color:var(--color-paper)]/60 text-[color:var(--color-ink)] " +
          "hover:bg-[color:var(--color-paper-2)] hover:border-[color:var(--color-ink-soft)]/40",
        ghost:
          "text-[color:var(--color-ink)] hover:bg-[color:var(--color-paper-3)]/60",
        destructive:
          "bg-[color:var(--color-destructive)] text-white " +
          "shadow-[0_2px_0_rgba(140,50,40,0.4),0_8px_18px_-8px_rgba(197,89,77,0.55)] " +
          "hover:bg-[color:var(--color-coral-deep)] hover:-translate-y-[1px]",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-[0.8rem]",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
