import { useEffect, useRef, useState } from "react"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { cn } from "cn"
import { formatDate } from "@/lib/format"
import type { Solicitation } from "@/types/domain"
import { RequestActionsMenu } from "@/components/solicitacoes/request-actions-menu"
import { StatusMark } from "@/components/solicitacoes/status-mark"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function pageTokens(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const near = [1, total, current - 1, current, current + 1].filter(
    (page) => page >= 1 && page <= total,
  )
  const unique = [...new Set(near)].sort((a, b) => a - b)
  const tokens: Array<number | "gap"> = []
  unique.forEach((page, index) => {
    if (index > 0 && page - unique[index - 1] > 1) tokens.push("gap")
    tokens.push(page)
  })
  return tokens
}

export function RequestTable({
  items,
  requesterName,
  empty,
  pageSize,
}: {
  items: Solicitation[]
  requesterName: (id: string) => string
  empty: string
  pageSize?: number
}) {
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const identity = items.map((item) => item.id).join("|")

  function openItem(id: string) {
    navigate(`/solicitacoes/${id}`)
  }

  useEffect(() => {
    setPage(1)
  }, [identity])

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card px-5 py-10 text-sm text-muted-foreground">
        {empty}
      </div>
    )
  }

  const size = pageSize && pageSize > 0 ? pageSize : items.length
  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * size
  const pageItems = items.slice(start, start + size)
  const from = start + 1
  const to = start + pageItems.length

  function go(next: number) {
    setPage(next)
    root.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }

  return (
    <div ref={root} className="scroll-mt-20">
      <ul className="grid gap-2 lg:hidden">
        {pageItems.map((item) => (
          <li key={item.id}>
            <div
              role="link"
              tabIndex={0}
              className="cursor-pointer rounded-lg border bg-card p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => openItem(item.id)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === "Enter") openItem(item.id)
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-primary">{item.code}</p>
                  <p className="mt-1 text-sm leading-5 font-medium break-words">{item.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <StatusMark status={item.status} />
                  <span onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                    <RequestActionsMenu item={item} />
                  </span>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Categoria</dt>
                  <dd className="mt-0.5">{item.category}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Abertura</dt>
                  <dd className="mt-0.5">{formatDate(item.createdAt)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Solicitante</dt>
                  <dd className="mt-0.5">{requesterName(item.requesterId)}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ul>

    <div className="hidden overflow-hidden rounded-lg border bg-card lg:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/70 hover:bg-secondary/70">
            <TableHead>Código</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            <TableHead className="hidden lg:table-cell">Solicitante</TableHead>
            <TableHead className="hidden sm:table-cell">Abertura</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right"> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((item) => (
            <TableRow
              key={item.id}
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => openItem(item.id)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === "Enter") openItem(item.id)
              }}
            >
              <TableCell className="font-mono text-[11px] text-primary">
                {item.code}
              </TableCell>
              <TableCell className="max-w-56 truncate text-sm">{item.title}</TableCell>
              <TableCell className="hidden text-sm md:table-cell">
                {item.category}
              </TableCell>
              <TableCell className="hidden text-sm lg:table-cell">
                {requesterName(item.requesterId)}
              </TableCell>
              <TableCell className="hidden text-sm sm:table-cell">
                {formatDate(item.createdAt)}
              </TableCell>
              <TableCell>
                <StatusMark status={item.status} />
              </TableCell>
              <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                <RequestActionsMenu item={item} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
      {pageSize ? (
        <nav
          aria-label="Paginação da lista"
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs text-muted-foreground tabular-nums">
            {from}–{to} de {items.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              disabled={current === 1}
              onClick={() => go(current - 1)}
            >
              <CaretLeftIcon />
              Anterior
            </Button>
            <span className="px-2 text-xs text-muted-foreground tabular-nums sm:hidden">
              {current} / {pageCount}
            </span>
            <div className="hidden items-center gap-1 sm:flex">
              {pageTokens(current, pageCount).map((token, index) =>
                token === "gap" ? (
                  <span key={`gap-${index}`} className="px-1 text-xs text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={token}
                    type="button"
                    aria-current={token === current ? "page" : undefined}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg text-xs tabular-nums",
                      token === current
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent",
                    )}
                    onClick={() => go(token)}
                  >
                    {token}
                  </button>
                ),
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              disabled={current === pageCount}
              onClick={() => go(current + 1)}
            >
              Próxima
              <CaretRightIcon />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  )
}
