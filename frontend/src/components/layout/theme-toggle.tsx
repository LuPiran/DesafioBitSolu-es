import { type MouseEvent } from "react"
import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { notice } from "@/components/feedback/notice"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"

  function changeTheme(event: MouseEvent<HTMLButtonElement>) {
    const next = dark ? "light" : "dark"
    const root = document.documentElement
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const apply = () => {
      root.classList.toggle("dark", next === "dark")
      root.style.colorScheme = next
      setTheme(next)
      notice.info(next === "dark" ? "Tema escuro." : "Tema claro.")
    }

    if (reduce || typeof document.startViewTransition !== "function") {
      apply()
      return
    }

    root.style.setProperty("--theme-x", `${x}px`)
    root.style.setProperty("--theme-y", `${y}px`)
    root.style.setProperty("--theme-r", `${endRadius}px`)
    document.startViewTransition(apply)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={changeTheme}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
