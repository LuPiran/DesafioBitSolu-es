import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export function MetricBand({
  metrics,
}: {
  metrics: Array<{ label: string; value: number }>
}) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const nodes = root.current?.querySelectorAll<HTMLElement>("[data-count]")
      if (!nodes) return
      const media = gsap.matchMedia()
      media.add("(prefers-reduced-motion: reduce)", () => {
        nodes.forEach((node) => {
          node.textContent = node.dataset.count ?? "0"
        })
      })
      media.add("(prefers-reduced-motion: no-preference)", () => {
        nodes.forEach((node) => {
          const target = Number(node.dataset.count ?? 0)
          const state = { value: 0 }
          gsap.to(state, {
            value: target,
            duration: 0.7,
            ease: "power2.out",
            onUpdate: () => {
              node.textContent = String(Math.round(state.value))
            },
          })
        })
      })
      return () => media.revert()
    },
    { scope: root, dependencies: [metrics.map((item) => item.value).join(",")], revertOnUpdate: true },
  )

  return (
    <section
      ref={root}
      className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card lg:grid-cols-4"
    >
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={`px-4 py-4 sm:px-5 ${index % 2 === 1 ? "border-l" : ""} ${index >= 2 ? "border-t lg:border-t-0" : ""} ${index > 0 ? "lg:border-l" : ""}`}
        >
          <p
            data-count={metric.value}
            className="font-heading text-3xl tracking-tight text-primary tabular-nums"
          >
            0
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
        </div>
      ))}
    </section>
  )
}
