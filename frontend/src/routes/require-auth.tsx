import { useEffect, useRef } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { notice } from "@/components/feedback/notice"
import { useAuth } from "@/providers/auth-provider"

export function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()
  const warned = useRef(false)

  useEffect(() => {
    if (!ready || user || warned.current) return
    warned.current = true
    notice.warning("Entre com seu usuário para acessar o portal.")
  }, [ready, user])

  if (!ready) return null
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
