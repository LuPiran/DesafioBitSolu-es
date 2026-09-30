export const CATEGORIES = ["TI", "RH", "Compras", "Financeiro", "Infraestrutura"] as const
export const STATUSES = ["ABERTO", "EM_ATENDIMENTO", "CONCLUIDO"] as const

export type Category = (typeof CATEGORIES)[number]
export type RequestStatus = (typeof STATUSES)[number]

export const ROLES = ["padrao", "admin"] as const
export type UserRole = (typeof ROLES)[number]

export type SessionUser = {
  id: string
  name: string
  username: string
  email: string
  role: UserRole
}

export type Solicitation = {
  id: string
  code: string
  title: string
  description: string
  category: Category
  requesterId: string
  requesterName: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
}

export function nextStatus(status: RequestStatus): RequestStatus | null {
  if (status === "ABERTO") return "EM_ATENDIMENTO"
  if (status === "EM_ATENDIMENTO") return "CONCLUIDO"
  return null
}
