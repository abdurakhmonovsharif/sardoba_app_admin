"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/40",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:bg-secondary/60",
  outline:
    "border border-border text-foreground hover:bg-muted disabled:opacity-50",
  ghost: "text-foreground hover:bg-muted/70 disabled:opacity-50",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/80 disabled:bg-destructive/60",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed",
        {
          sm: "h-8 px-3 text-xs",
          md: "h-10 px-4 text-sm",
          lg: "h-12 px-6 text-base",
        }[size],
        variantClasses[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {leftIcon && <span className="text-base">{leftIcon}</span>}
      <span>{isLoading ? "Please wait..." : children}</span>
      {rightIcon && <span className="text-base">{rightIcon}</span>}
    </button>
  ),
);
Button.displayName = "Button";
