import type { SessionUser, Solicitation, SolicitationDraft } from "@/types/domain"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-Portal-Request": "1",
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError(0, "Não foi possível falar com o servidor.")
  }

  if (response.status === 204) return undefined as T
  const body = (await response.json().catch(() => null)) as { message?: string } | null
  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? "Não foi possível concluir agora.")
  }
  return body as T
}

export const api = {
  login(email: string, password: string) {
    return request<{ user: SessionUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  },
  logout() {
    return request<void>("/api/auth/logout", { method: "POST" })
  },
  me() {
    return request<{ user: SessionUser }>("/api/auth/me")
  },
  listSolicitations() {
    return request<{ items: Solicitation[] }>("/api/solicitations")
  },
  createSolicitation(draft: SolicitationDraft) {
    return request<{ item: Solicitation }>("/api/solicitations", {
      method: "POST",
      body: JSON.stringify(draft),
    })
  },
  updateSolicitation(id: string, draft: SolicitationDraft) {
    return request<{ item: Solicitation }>(`/api/solicitations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(draft),
    })
  },
  advanceSolicitation(id: string) {
    return request<{ item: Solicitation }>(`/api/solicitations/${id}/status`, {
      method: "POST",
      body: JSON.stringify({}),
    })
  },
  removeSolicitation(id: string) {
    return request<{ item: Solicitation }>(`/api/solicitations/${id}`, {
      method: "DELETE",
    })
  },
}
