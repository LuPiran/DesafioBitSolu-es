import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AccentRule } from "@/components/motion/accent-rule"
import {
  emptyFilters,
  FiltersBar,
  type RequestFilters,
} from "@/components/solicitacoes/filters-bar"
import { RequestTable } from "@/components/solicitacoes/request-table"
import { Button } from "@/components/ui/button"
import { dayKey } from "@/lib/format"
import { useRequests } from "@/providers/requests-provider"

function applyFilters(filters: RequestFilters, title: string, category: string, status: string, createdAt: string) {
  const text = filters.text.trim().toLowerCase()
  if (text && !title.toLowerCase().includes(text)) return false
  if (filters.category !== "todas" && category !== filters.category) return false
  if (filters.status !== "todos" && status !== filters.status) return false
  const day = dayKey(createdAt)
  if (filters.from && day < filters.from) return false
  if (filters.to && day > filters.to) return false
  return true
}

export function RequestsPage() {
  const { items, requesterName } = useRequests()
  const [filters, setFilters] = useState<RequestFilters>(emptyFilters)

  const visible = useMemo(
    () =>
      items.filter((item) =>
        applyFilters(filters, item.title, item.category, item.status, item.createdAt),
      ),
    [filters, items],
  )

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <AccentRule />
          <p className="text-sm text-muted-foreground">
            {visible.length} de {items.length} solicitações
          </p>
        </div>
        <Button className="w-full sm:w-auto" asChild>
          <Link to="/solicitacoes/nova">Nova solicitação</Link>
        </Button>
      </div>
      <div className="mt-4">
        <FiltersBar filters={filters} onChange={setFilters} />
      </div>
      <div className="mt-4">
        <RequestTable
          items={visible}
          requesterName={requesterName}
          empty="Nenhuma solicitação com esses filtros."
          pageSize={10}
        />
      </div>
    </div>
  )
}
