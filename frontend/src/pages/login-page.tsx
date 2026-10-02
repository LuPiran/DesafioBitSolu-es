import { useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { EyeClosedIcon, EyeIcon } from "@phosphor-icons/react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { notice } from "@/components/feedback/notice"
import { BrandLogo } from "@/components/layout/brand-logo"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/providers/auth-provider"

export function LoginPage() {
  const root = useRef<HTMLDivElement>(null)
  const { user, ready, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({ defaults: { ease: "power2.out" } })
        timeline
          .from(".login-mark", { autoAlpha: 0, y: 10, duration: 0.4 })
          .from(".login-rule", { scaleX: 0, duration: 0.45, transformOrigin: "left center" }, "-=0.15")
          .from(".login-copy", { autoAlpha: 0, y: 12, duration: 0.45 }, "-=0.2")
          .from(".login-field", { autoAlpha: 0, y: 8, duration: 0.35, stagger: 0.07 }, "-=0.15")
      })
      return () => media.revert()
    },
    { scope: root },
  )

  if (!ready) return null
  if (user) return <Navigate to="/" replace />

  return (
    <div ref={root} className="grid min-h-svh md:grid-cols-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="flex flex-col justify-between bg-sidebar px-5 py-6 text-sidebar-foreground sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        <BrandLogo className="login-mark h-9 w-auto" />
        <div className="max-w-md py-6 sm:py-10 lg:py-12">
          <div className="login-rule mb-5 h-px w-14 origin-left bg-[oklch(0.78_0.09_225)] sm:mb-6" />
          <h1 className="login-copy text-2xl leading-tight font-medium tracking-tight sm:text-3xl">
            Portal de solicitações internas
          </h1>
          <p className="login-copy mt-4 text-sm leading-6 text-sidebar-foreground/70">
            Cada demanda fica com código, categoria e status, do registro até a conclusão.
          </p>
        </div>
        <p className="login-copy text-xs text-sidebar-foreground/45">
          Ambiente de demonstração. O acesso passa pela API do portal.
        </p>
      </section>

      <section className="relative flex items-center bg-background px-5 py-10 sm:px-6 sm:py-16">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <form
          className="mx-auto w-full max-w-sm"
          onSubmit={(event) => {
            event.preventDefault()
            if (submitting) return
            if (!email.trim() || !password) {
              notice.warning("Informe e-mail e senha.")
              return
            }
            setSubmitting(true)
            void login(email, password).then((result) => {
              setSubmitting(false)
              if (!result.ok) {
                notice.error(result.message)
                return
              }
              notice.success("Sessão iniciada.")
              navigate(from, { replace: true })
            })
          }}
        >
          <p className="login-field text-xs tracking-wide text-muted-foreground">Acesso</p>
          <h2 className="login-field mt-1 text-2xl font-medium tracking-tight">Entrar</h2>
          <div className="login-field mt-8 space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              className="h-11 text-base md:h-9 md:text-sm"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="login-field mt-4 space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <Input
                id="senha"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                className="h-11 pr-10 text-base md:h-9 md:text-sm"
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeIcon className="size-4" /> : <EyeClosedIcon className="size-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="login-field mt-6 h-11 w-full text-sm md:h-9" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </section>
    </div>
  )
}
