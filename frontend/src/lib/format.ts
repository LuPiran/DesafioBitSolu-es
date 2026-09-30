import type { RequestStatus } from "@/types/domain"

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export const STATUS_LABEL: Record<RequestStatus, string> = {
  ABERTO: "Aberto",
  EM_ATENDIMENTO: "Em atendimento",
  CONCLUIDO: "Concluído",
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

export function dayKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function nextCode(codes: string[]) {
  const max = codes.reduce((highest, code) => {
    const number = Number(code.replace("SOL-", ""))
    return Number.isFinite(number) ? Math.max(highest, number) : highest
  }, 0)
  return `SOL-${String(max + 1).padStart(4, "0")}`
}

export function nowStamp() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function nextStatus(status: RequestStatus): RequestStatus | null {
  if (status === "ABERTO") return "EM_ATENDIMENTO"
  if (status === "EM_ATENDIMENTO") return "CONCLUIDO"
  return null
}
