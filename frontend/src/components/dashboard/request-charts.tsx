import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { useReducedMotion } from "motion/react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts"
import { CATEGORIES, STATUSES, type Solicitation } from "@/types/domain"
import { dayKey, STATUS_LABEL } from "@/lib/format"

const FALLBACK = [
  "oklch(0.72 0.1 230)",
  "oklch(0.48 0.08 252)",
  "oklch(0.34 0.07 252)",
  "oklch(0.62 0.04 250)",
  "oklch(0.78 0.06 220)",
]

type Palette = {
  series: string[]
  grid: string
  tick: string
}

function usePalette(): Palette {
  const { resolvedTheme } = useTheme()
  const [palette, setPalette] = useState<Palette>({
    series: FALLBACK,
    grid: "oklch(0.9 0.015 245)",
    tick: "oklch(0.48 0.03 255)",
  })

  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    const read = (name: string) => style.getPropertyValue(name).trim()
    const series = [1, 2, 3, 4, 5].map((index) => read(`--chart-${index}`)).filter(Boolean)
    setPalette({
      series: series.length === 5 ? series : FALLBACK,
      grid: read("--border") || "oklch(0.9 0.015 245)",
      tick: read("--muted-foreground") || "oklch(0.48 0.03 255)",
    })
  }, [resolvedTheme])

  return palette
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function parseKey(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function toKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function ChartFrame({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: React.ReactNode
}) {
  return (
    <section className="min-w-0 rounded-lg border bg-card p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
      <div className="mt-3 h-56">{children}</div>
    </section>
  )
}

function Tip({ active, payload, label }: TooltipContentProps) {
  if (!active || payload.length === 0) return null
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm">
      {label ? <p className="mb-1 text-muted-foreground">{label}</p> : null}
      {payload.map((entry) => (
        <p key={String(entry.name)} className="flex items-center gap-2">
          <span
            className="size-1.5 rounded-full"
            style={{ background: entry.color || entry.payload?.fill }}
          />
          <span>{entry.name}</span>
          <span className="font-medium tabular-nums">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function Swatches({ rows }: { rows: Array<{ name: string; fill: string }> }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {rows.map((row) => (
        <li key={row.name} className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full" style={{ background: row.fill }} />
          {row.name}
        </li>
      ))}
    </ul>
  )
}

export function RequestCharts({ items }: { items: Solicitation[] }) {
  const palette = usePalette()
  const reduce = useReducedMotion()
  const animate = !reduce

  const model = useMemo(() => {
    const status = STATUSES.map((status, index) => ({
      name: STATUS_LABEL[status],
      value: items.filter((item) => item.status === status).length,
      fill: palette.series[index % palette.series.length],
    }))

    const categories = CATEGORIES.map((category, index) => ({
      name: category,
      total: items.filter((item) => item.category === category).length,
      fill: palette.series[index % palette.series.length],
    }))

    const days = items.map((item) => dayKey(item.createdAt)).sort()
    const timeline: Array<{ day: string; aberturas: number; acumulado: number }> = []
    if (days.length > 0) {
      const counts = new Map<string, number>()
      for (const day of days) counts.set(day, (counts.get(day) ?? 0) + 1)
      const cursor = parseKey(days[0])
      const end = parseKey(days[days.length - 1])
      let total = 0
      while (cursor <= end) {
        const key = toKey(cursor)
        const aberturas = counts.get(key) ?? 0
        total += aberturas
        timeline.push({
          day: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
          aberturas,
          acumulado: total,
        })
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    return { status, categories, timeline }
  }, [items, palette.series])

  const tick = { fill: palette.tick, fontSize: 11 }
  const grid = palette.grid

  if (items.length === 0) {
    return (
      <p className="rounded-lg border bg-card px-4 py-8 text-sm text-muted-foreground">
        Nenhuma solicitação para montar os gráficos.
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <ChartFrame title="Situação" note="Parte aberta, em atendimento e concluída.">
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={model.status}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={3}
                  stroke="none"
                  isAnimationActive={animate}
                >
                  {model.status.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                </Pie>
                <Tooltip content={Tip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Swatches rows={model.status} />
        </div>
      </ChartFrame>

      <ChartFrame title="Categorias" note="Quantidade de solicitações em cada área.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={model.categories} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid stroke={grid} horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={108}
              tick={tick}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={Tip} cursor={{ fill: grid, fillOpacity: 0.35 }} />
            <Bar dataKey="total" name="Solicitações" radius={[0, 6, 6, 0]} isAnimationActive={animate}>
              {model.categories.map((row) => (
                <Cell key={row.name} fill={row.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame title="Aberturas" note="Novas solicitações em cada dia do período.">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={model.timeline} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false} interval={4} />
            <YAxis allowDecimals={false} width={28} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip content={Tip} />
            <Area
              type="monotone"
              dataKey="aberturas"
              name="Aberturas"
              stroke={palette.series[0]}
              fill={palette.series[0]}
              fillOpacity={0.22}
              strokeWidth={2}
              isAnimationActive={animate}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame title="Acumulado" note="Total de solicitações desde a primeira abertura.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={model.timeline} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false} interval={4} />
            <YAxis allowDecimals={false} width={28} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip content={Tip} />
            <Line
              type="monotone"
              dataKey="acumulado"
              name="Acumulado"
              stroke={palette.series[2]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={animate}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame title="Perfil" note="Comparação do volume entre as categorias.">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={model.categories} cx="50%" cy="50%" outerRadius="68%">
            <PolarGrid stroke={grid} />
            <PolarAngleAxis dataKey="name" tick={tick} />
            <Tooltip content={Tip} />
            <Radar
              dataKey="total"
              name="Solicitações"
              stroke={palette.series[1]}
              fill={palette.series[1]}
              fillOpacity={0.28}
              isAnimationActive={animate}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame title="Peso do status" note="Quanto cada situação ocupa no total.">
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={model.status}
                innerRadius="22%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  dataKey="value"
                  name="Solicitações"
                  background={{ fill: grid }}
                  cornerRadius={8}
                  isAnimationActive={animate}
                />
                <Tooltip content={Tip} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <Swatches rows={model.status} />
        </div>
      </ChartFrame>
    </div>
  )
}
