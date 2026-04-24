"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base editorial
          "inline-flex items-center justify-center gap-2 font-semibold",
          "tracking-[0.04em] uppercase text-[13px]",
          "border transition-all duration-200 cursor-pointer select-none whitespace-nowrap",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "rounded-[var(--r-sm)]",
          {
            // Primary — preto sólido, hover inverte
            "bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] hover:bg-transparent hover:text-[var(--ink)]":
              variant === "primary",
            // Secondary — cinza quente
            "bg-[var(--bg-2)] text-[var(--ink)] border-[var(--border)] hover:bg-[var(--border)]":
              variant === "secondary",
            // Outline — borda preta, hover preenche
            "bg-transparent text-[var(--ink)] border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)]":
              variant === "outline",
            // Ghost — sem borda
            "bg-transparent text-[var(--muted)] border-transparent hover:text-[var(--ink)] tracking-normal normal-case text-sm":
              variant === "ghost",
            // Danger
            "bg-red-600 text-white border-red-600 hover:bg-red-700":
              variant === "danger",
            // Sizes
            "px-[18px] py-[11px] text-[11px]": size === "sm",
            "px-[26px] py-[14px]":             size === "md",
            "px-[32px] py-[18px]":             size === "lg",
          },
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
