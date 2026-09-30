import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const alertVariants = cva(
  "relative grid w-full gap-0.5 rounded-lg border px-3 py-2.5 text-left text-sm has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:mt-0.5 *:[svg]:size-4 *:[svg]:text-current",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        info: "border-[oklch(0.72_0.08_230)] bg-[oklch(0.96_0.03_230)] text-[oklch(0.32_0.06_250)] dark:border-[oklch(0.62_0.08_230)] dark:bg-[oklch(0.28_0.04_250)] dark:text-[oklch(0.94_0.02_230)]",
        success:
          "border-[oklch(0.68_0.12_150)] bg-[oklch(0.96_0.04_150)] text-[oklch(0.32_0.08_155)] dark:border-[oklch(0.62_0.1_150)] dark:bg-[oklch(0.28_0.05_155)] dark:text-[oklch(0.93_0.04_150)]",
        warning:
          "border-[oklch(0.78_0.13_85)] bg-[oklch(0.97_0.04_95)] text-[oklch(0.38_0.08_70)] dark:border-[oklch(0.72_0.11_85)] dark:bg-[oklch(0.3_0.05_80)] dark:text-[oklch(0.95_0.04_95)]",
        destructive:
          "border-[oklch(0.68_0.16_25)] bg-[oklch(0.97_0.03_25)] text-[oklch(0.4_0.14_25)] dark:border-[oklch(0.65_0.14_25)] dark:bg-[oklch(0.3_0.06_25)] dark:text-[oklch(0.95_0.03_25)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-medium tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm leading-5 opacity-90", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
