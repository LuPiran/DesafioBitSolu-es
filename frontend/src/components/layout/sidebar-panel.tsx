import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { SidebarNav } from "@/components/layout/sidebar-nav"

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 px-4">
      <span className="size-7 rounded-md bg-[oklch(0.72_0.1_220)]" />
      <div>
        <p className="text-sm font-medium tracking-tight text-sidebar-foreground">
          Solicitações
        </p>
        <p className="text-[11px] text-sidebar-foreground/55">Portal interno</p>
      </div>
    </div>
  )
}

export function SidebarPanel({ onNavigate }: { onNavigate?: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".side-item", {
          autoAlpha: 0,
          y: 8,
          duration: 0.4,
          stagger: 0.06,
          ease: "power2.out",
        })
      })
      return () => media.revert()
    },
    { scope: root },
  )

  return (
    <div ref={root} className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="side-item py-5">
        <SidebarBrand />
      </div>
      <div className="side-item px-2">
        <SidebarNav onNavigate={onNavigate} />
      </div>
    </div>
  )
}
