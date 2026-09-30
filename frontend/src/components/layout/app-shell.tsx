import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { PageTransition } from "@/components/motion/page-transition"
import { SidebarPanel } from "@/components/layout/sidebar-panel"
import { Topbar } from "@/components/layout/topbar"

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  return (
    <div className="min-h-svh overflow-x-hidden bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border md:block">
        <SidebarPanel />
      </aside>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              className="fixed inset-0 z-40 bg-[oklch(0.2_0.04_255/0.45)] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-60 md:hidden"
              initial={reduce ? false : { x: -240 }}
              animate={{ x: 0 }}
              exit={reduce ? { x: 0 } : { x: -240 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <SidebarPanel onNavigate={() => setMenuOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="min-w-0 md:pl-60">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <PageTransition />
        </main>
      </div>
    </div>
  )
}
