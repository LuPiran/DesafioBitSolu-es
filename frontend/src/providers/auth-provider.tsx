import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ApiError, api } from "@/lib/api"
import type { SessionUser } from "@/types/domain"

type AuthResult = { ok: true } | { ok: false; message: string }

type AuthContextValue = {
  user: SessionUser | null
  ready: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    api
      .me()
      .then((result) => {
        if (active) setUser(result.user)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login: async (email, password) => {
        try {
          const result = await api.login(email, password)
          setUser(result.user)
          return { ok: true }
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : "Não foi possível falar com o servidor."
          return { ok: false, message }
        }
      },
      logout: async () => {
        try {
          await api.logout()
        } finally {
          setUser(null)
        }
      },
    }),
    [ready, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth precisa ficar dentro de AuthProvider.")
  }
  return context
}
