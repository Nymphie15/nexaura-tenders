/**
 * Button accessible avec états de chargement
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: "default" | "destructive" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    children, 
    loading = false, 
    loadingText = "Chargement...",
    disabled,
    variant = "default",
    size = "md",
    ...props 
  }, ref) => {
    const variantStyles = {
      default: "bg-indigo-600 text-white hover:bg-indigo-700",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      outline: "border border-input bg-transparent hover:bg-accent",
      ghost: "bg-transparent hover:bg-accent",
    }
    
    const sizeStyles = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4",
      lg: "h-12 px-6 text-lg",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingText}</span>
            <span aria-hidden="true">{loadingText}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

AccessibleButton.displayName = "AccessibleButton"
