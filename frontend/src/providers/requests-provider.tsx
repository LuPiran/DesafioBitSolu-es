import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ApiError, api } from "@/lib/api"
import { useAuth } from "@/providers/auth-provider"
import type { Solicitation, SolicitationDraft } from "@/types/domain"

type ActionResult = { ok: true; code: string } | { ok: false; message: string }

type RequestsContextValue = {
  items: Solicitation[]
  ready: boolean
  requesterName: (id: string) => string
  create: (draft: SolicitationDraft) => Promise<ActionResult>
  update: (id: string, draft: SolicitationDraft) => Promise<ActionResult>
  remove: (id: string) => Promise<ActionResult>
  advanceStatus: (id: string) => Promise<ActionResult>
}

const RequestsContext = createContext<RequestsContextValue | null>(null)

function failure(error: unknown): ActionResult {
  if (error instanceof ApiError) return { ok: false, message: error.message }
  return { ok: false, message: "Não foi possível falar com o servidor." }
}

export function RequestsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<Solicitation[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) {
      setItems([])
      setReady(true)
      return
    }
    let active = true
    setReady(false)
    api
      .listSolicitations()
      .then((result) => {
        if (active) setItems(result.items)
      })
      .catch(() => {
        if (active) setItems([])
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [user])

  const value = useMemo<RequestsContextValue>(() => {
    const requesterName = (id: string) =>
      items.find((item) => item.requesterId === id)?.requesterName ?? "Colaborador"

    return {
      items,
      ready,
      requesterName,
      create: async (draft) => {
        try {
          const result = await api.createSolicitation(draft)
          setItems((current) => [result.item, ...current.filter((item) => item.id !== result.item.id)])
          return { ok: true, code: result.item.code }
        } catch (error) {
          return failure(error)
        }
      },
      update: async (id, draft) => {
        try {
          const result = await api.updateSolicitation(id, draft)
          setItems((current) => current.map((item) => (item.id === id ? result.item : item)))
          return { ok: true, code: result.item.code }
        } catch (error) {
          return failure(error)
        }
      },
      remove: async (id) => {
        try {
          const result = await api.removeSolicitation(id)
          setItems((list) => list.filter((item) => item.id !== id))
          return { ok: true, code: result.item.code }
        } catch (error) {
          return failure(error) 
        }
      },
      advanceStatus: async (id) => {
        try {
          const result = await api.advanceSolicitation(id)
          setItems((current) => current.map((item) => (item.id === id ? result.item : item)))
          return { ok: true, code: result.item.code }
        } catch (error) {
          return failure(error)
        }
      },
    }
  }, [items, ready])

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>
}

export function useRequests() {
  const context = useContext(RequestsContext)
  if (!context) {
    throw new Error("useRequests precisa ficar dentro de RequestsProvider.")
  }
  return context
}
