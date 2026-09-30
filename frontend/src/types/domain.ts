export const CATEGORIES = [
  "TI",
  "RH",
  "Compras",
  "Financeiro",
  "Infraestrutura",
] as const

export type Category = (typeof CATEGORIES)[number]

export const STATUSES = ["ABERTO", "EM_ATENDIMENTO", "CONCLUIDO"] as const

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

export type SolicitationDraft = {
  title: string
  description: string
  category: Category
}
