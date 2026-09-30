import { cn } from "cn"
import { STATUS_LABEL } from "@/lib/format"
import type { RequestStatus } from "@/types/domain"

const dotClass: Record<RequestStatus, string> = {
  ABERTO: "bg-[oklch(0.68_0.12_225)]",
  EM_ATENDIMENTO: "bg-[oklch(0.42_0.09_252)] dark:bg-[oklch(0.74_0.08_225)]",
  CONCLUIDO: "bg-[oklch(0.62_0.02_250)] dark:bg-[oklch(0.72_0.02_250)]",
}

export function StatusMark({ status }: { status: RequestStatus }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-foreground">
      <span className={cn("size-1.5 shrink-0", dotClass[status])} />
      {STATUS_LABEL[status]}
    </span>
  )
}
