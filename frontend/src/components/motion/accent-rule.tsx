import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export function AccentRule() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, {
          scaleX: 0,
          duration: 0.55,
          ease: "power2.out",
          transformOrigin: "left center",
        })
      })
      return () => media.revert()
    },
    { scope: ref },
  )

  return (
    <div
      ref={ref}
      className="mb-5 h-px w-14 origin-left bg-[oklch(0.62_0.12_230)]"
    />
  )
}
