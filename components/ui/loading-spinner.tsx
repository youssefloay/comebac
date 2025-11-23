import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
}

export function LoadingSpinner({ className, size = "md", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-10 h-10", 
    lg: "w-16 h-16"
  }

  const borderClasses = {
    sm: "border-2",
    md: "border-[3px]",
    lg: "border-4"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Glow effect - Modern 2025 */}
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-xl animate-pulse",
            "bg-gradient-to-r from-green-500/60 via-emerald-500/60 to-blue-500/60",
            sizeClasses[size]
          )}
        />
        
        {/* Spinner with gradient border - Pure CSS, no Framer Motion */}
        <div
          className={cn(
            "relative rounded-full",
            "border-gray-200 dark:border-gray-700",
            borderClasses[size],
            sizeClasses[size],
            "animate-spin"
          )}
        >
          {/* Gradient overlay */}
          <div className={cn(
            "absolute inset-0 rounded-full",
            "border-transparent",
            "border-t-green-500 border-r-emerald-500 border-b-blue-500 border-l-transparent",
            borderClasses[size]
          )} />
        </div>
      </div>
      
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {text}
        </p>
      )}
    </div>
  )
}