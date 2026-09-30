import { notice } from "@/components/feedback/notice"
import { CATEGORIES, STATUSES, type Category, type RequestStatus } from "@/types/domain"
import { STATUS_LABEL } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type RequestFilters = {
  text: string
  category: "todas" | Category
  status: "todos" | RequestStatus
  from: string
  to: string
}

export const emptyFilters: RequestFilters = {
  text: "",
  category: "todas",
  status: "todos",
  from: "",
  to: "",
}

export function FiltersBar({
  filters,
  onChange,
}: {
  filters: RequestFilters
  onChange: (next: RequestFilters) => void
}) {
  const set = (patch: Partial<RequestFilters>) => {
    const next = { ...filters, ...patch }
    if (next.from && next.to && next.from > next.to) {
      notice.warning("A data inicial não pode ser maior que a final.")
      return
    }
    onChange(next)
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-6">
      <div className="space-y-1.5 sm:col-span-2 xl:col-span-2">
        <Label htmlFor="filtro-texto">Texto no título</Label>
        <Input
          id="filtro-texto"
          value={filters.text}
          placeholder="Ex.: impressora, VPN, folha"
          className="h-11 text-base md:h-9 md:text-sm"
          onChange={(event) => onChange({ ...filters, text: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => set({ category: value as RequestFilters["category"] })}
        >
          <SelectTrigger className="h-11 w-full text-base md:h-9 md:text-sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => set({ status: value as RequestFilters["status"] })}
        >
          <SelectTrigger className="h-11 w-full text-base md:h-9 md:text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filtro-de">Abertura de</Label>
        <DatePicker
          id="filtro-de"
          value={filters.from}
          max={filters.to || undefined}
          placeholder="Início"
          onChange={(from) => set({ from })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filtro-ate">Abertura até</Label>
        <DatePicker
          id="filtro-ate"
          value={filters.to}
          min={filters.from || undefined}
          placeholder="Fim"
          onChange={(to) => set({ to })}
        />
      </div>
      <div className="flex items-end sm:col-span-2 xl:col-span-6">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full sm:h-8 sm:w-auto"
          onClick={() => {
            onChange(emptyFilters)
            notice.info("Filtros limpos.")
          }}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  )
}
