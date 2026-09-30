import { ClipboardTextIcon, SquaresFourIcon } from "@phosphor-icons/react"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import { NavLink } from "react-router-dom"
import { cn } from "cn"

const links = [
  { to: "/", label: "Painel", icon: SquaresFourIcon, end: true },
  { to: "/solicitacoes", label: "Solicitações", icon: ClipboardTextIcon, end: false },
]

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const reduce = useReducedMotion()

  return (
    <LayoutGroup>
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "relative mx-2 flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:text-sidebar-foreground",
                  isActive && "bg-sidebar-accent text-sidebar-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute top-1.5 bottom-1.5 left-0 w-0.5 bg-[oklch(0.78_0.09_225)]"
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 34 }
                      }
                    />
                  )}
                  <Icon className="size-4" />
                  {link.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </LayoutGroup>
  )
}
