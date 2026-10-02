import { Link } from "react-router-dom"
import { AccentRule } from "@/components/motion/accent-rule"
import { MetricBand } from "@/components/dashboard/metric-band"
import { RequestCharts } from "@/components/dashboard/request-charts"
import { RequestTable } from "@/components/solicitacoes/request-table"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/auth-provider"
import { useRequests } from "@/providers/requests-provider"

export function DashboardPage() {
  const { user } = useAuth()
  const { items, requesterName } = useRequests()
  const firstName = user?.name?.split(" ")[0]
  const open = items.filter((item) => item.status === "ABERTO").length
  const progress = items.filter((item) => item.status === "EM_ATENDIMENTO").length
  const done = items.filter((item) => item.status === "CONCLUIDO").length
  const recent = [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium tracking-tight text-foreground">
            Bem-vindo de volta{firstName ? `, ${firstName}` : ""}{" "}
            <span className="wave-hand" aria-hidden="true">
              👋
            </span>
          </h1>
          <AccentRule />
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Volume das demandas internas neste ambiente. Os números acompanham a lista de solicitações.
          </p>
        </div>
        <Button className="w-full sm:w-auto" asChild>
          <Link to="/solicitacoes/nova">Nova solicitação</Link>
        </Button>
      </div>

      <div className="mt-6">
        <MetricBand
          metrics={[
            { label: "No total", value: items.length },
            { label: "Abertas", value: open },
            { label: "Em atendimento", value: progress },
            { label: "Concluídas", value: done },
          ]}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium">Leitura das solicitações</h2>
        <div className="mt-3">
          <RequestCharts items={items} />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Últimas aberturas</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/solicitacoes">Ver todas</Link>
        </Button>
      </div>
      <div className="mt-3">
        <RequestTable
          items={recent}
          requesterName={requesterName}
          empty="Nenhuma solicitação registrada."
        />
      </div>
    </div>
  )
}
