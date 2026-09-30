import { Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/app-shell"
import { DashboardPage } from "@/pages/dashboard-page"
import { LoginPage } from "@/pages/login-page"
import { RequestDetailPage } from "@/pages/request-detail-page"
import { RequestFormPage } from "@/pages/request-form-page"
import { RequestsPage } from "@/pages/requests-page"
import { RequireAuth } from "@/routes/require-auth"

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="solicitacoes" element={<RequestsPage />} />
          <Route path="solicitacoes/nova" element={<RequestFormPage />} />
          <Route path="solicitacoes/:id" element={<RequestDetailPage />} />
          <Route path="solicitacoes/:id/editar" element={<RequestFormPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
