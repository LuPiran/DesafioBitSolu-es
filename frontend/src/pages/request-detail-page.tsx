import { useEffect, useRef } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { notice } from "@/components/feedback/notice"
import { AccentRule } from "@/components/motion/accent-rule"
import { RequestActionsMenu } from "@/components/solicitacoes/request-actions-menu"
import { StatusMark } from "@/components/solicitacoes/status-mark"
import { Button } from "@/components/ui/button"
import { formatDateTime, nextStatus, STATUS_LABEL } from "@/lib/format"
import { useAuth } from "@/providers/auth-provider"
import { useRequests } from "@/providers/requests-provider"

export function RequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { items, ready, requesterName, advanceStatus } = useRequests()
  const item = items.find((entry) => entry.id === id)
  const seen = useRef(Boolean(item))
  if (item) seen.current = true

  useEffect(() => {
    if (!ready || item || seen.current) return
    notice.error("Solicitação não encontrada.")
  }, [item, ready])

  if (!user || !ready) return null
  if (!item) return <Navigate to="/solicitacoes" replace />

  const upcoming = nextStatus(item.status)

  return (
    <div className="mx-auto max-w-5xl">
      <AccentRule />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-primary">{item.code}</p>
          <h2 className="mt-1 max-w-2xl text-xl font-medium tracking-tight break-words sm:text-2xl">{item.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <StatusMark status={item.status} />
          <RequestActionsMenu item={item} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)]">
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h3 className="text-xs text-muted-foreground">Descrição</h3>
          <p className="mt-3 text-sm leading-6">{item.description}</p>
        </section>
        <aside className="rounded-lg border bg-card p-4 text-sm sm:p-5">
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-muted-foreground">Categoria</dt>
              <dd className="mt-1">{item.category}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Solicitante</dt>
              <dd className="mt-1">{requesterName(item.requesterId)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Abertura</dt>
              <dd className="mt-1">{formatDateTime(item.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Atualização</dt>
              <dd className="mt-1">{formatDateTime(item.updatedAt)}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap [&_a]:w-full [&_button]:w-full sm:[&_a]:w-auto sm:[&_button]:w-auto">
        <Button
          type="button"
          onClick={() => {
            void advanceStatus(item.id).then((result) => {
              if (!result.ok) {
                notice.warning(result.message)
                return
              }
              const label = upcoming ? STATUS_LABEL[upcoming] : "atualizado"
              notice.success(`${item.code} passou para ${label}.`)
            })
          }}
        >
          {upcoming ? `Mover para ${STATUS_LABEL[upcoming]}` : "Concluída"}
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link to="/solicitacoes">Voltar</Link>
        </Button>
      </div>
    </div>
  )
}
