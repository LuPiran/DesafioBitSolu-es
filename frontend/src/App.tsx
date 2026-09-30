import { ThemeProvider } from "next-themes"
import { BrowserRouter } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NoticeHost } from "@/components/feedback/notice"
import { AuthProvider } from "@/providers/auth-provider"
import { RequestsProvider } from "@/providers/requests-provider"
import { AppRouter } from "@/routes/app-router"

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <AuthProvider>
          <RequestsProvider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
            <NoticeHost />
          </RequestsProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
