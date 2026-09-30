import { ListIcon, SignOutIcon } from "@phosphor-icons/react"
import { useLocation, useNavigate } from "react-router-dom"
import { notice } from "@/components/feedback/notice"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/providers/auth-provider"

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]
  if (!first) return "?"
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined
  if (!last) return first.slice(0, 2).toUpperCase()
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase()
}

function pageTitle(pathname: string) {
  if (pathname === "/") return "Painel"
  if (pathname === "/solicitacoes") return "Solicitações"
  if (pathname === "/solicitacoes/nova") return "Nova solicitação"
  if (pathname.endsWith("/editar")) return "Editar solicitação"
  if (pathname.startsWith("/solicitacoes/")) return "Detalhe da solicitação"
  return "Portal"
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-card px-3 sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menu"
          onClick={onOpenMenu}
        >
          <ListIcon />
        </Button>
        <h1 className="truncate text-sm font-medium tracking-tight">{pageTitle(pathname)}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-medium tracking-wide text-primary-foreground outline-none hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={user ? `Conta de ${user.name}` : "Conta"}
            >
              {user ? initials(user.name) : ""}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate text-sm text-foreground">{user?.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {user?.role === "admin" ? "Administrador" : "Usuário padrão"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void logout().then(() => {
                  notice.success("Sessão encerrada.")
                  navigate("/login")
                })
              }}
            >
              <SignOutIcon />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
