import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { BrandLogo } from "@/components/layout/brand-logo"
import { SidebarNav } from "@/components/layout/sidebar-nav"

export function SidebarBrand() {
  return (
    <div className="px-4">
      <BrandLogo className="h-8 w-auto" />
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
