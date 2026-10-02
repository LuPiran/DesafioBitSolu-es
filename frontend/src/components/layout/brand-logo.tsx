type BrandVariant = "escura" | "clara"

const sources: Record<BrandVariant, string> = {
  escura: "/brand/logo-escura-horizontal.png",
  clara: "/brand/logo-clara-horizontal.png",
}

export function BrandLogo({
  variant = "escura",
  className,
}: {
  variant?: BrandVariant
  className?: string
}) {
  return <img src={sources[variant]} alt="Bit Soluções" className={className} />
}
