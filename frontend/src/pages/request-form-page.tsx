import { useEffect, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { notice } from "@/components/feedback/notice"
import { AccentRule } from "@/components/motion/accent-rule"
import { SolicitationFields } from "@/components/solicitacoes/solicitation-fields"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/auth-provider"
import { useRequests } from "@/providers/requests-provider"
import type { SolicitationDraft } from "@/types/domain"

const blank: SolicitationDraft = {
  title: "",
  description: "",
  category: "TI",
}

function invalidDraft(draft: SolicitationDraft) {
  if (draft.title.trim().length < 5) {
    return "O título precisa ter pelo menos 5 caracteres."
  }
  if (draft.description.trim().length < 15) {
    return "Descreva a demanda com pelo menos 15 caracteres."
  }
  return null
}

export function RequestFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, ready, create, update, requesterName } = useRequests()
  const existing = id ? items.find((item) => item.id === id) : undefined
  const editing = Boolean(id)

  const [draft, setDraft] = useState<SolicitationDraft>(blank)
  const [hydrated, setHydrated] = useState(!id)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!existing) return
    setDraft({
      title: existing.title,
      description: existing.description,
      category: existing.category,
    })
    setHydrated(true)
  }, [existing])

  const blocked = useMemo(() => {
    if (!editing || !user || !ready) return null
    if (!existing) {
      return {
        to: "/solicitacoes",
        message: "Solicitação não encontrada.",
        kind: "error" as const,
      }
    }
    if (user.role !== "admin" && existing.requesterId !== user.id) {
      return {
        to: `/solicitacoes/${existing.id}`,
        message: "Só o autor pode editar esta solicitação.",
        kind: "warning" as const,
      }
    }
    if (existing.status !== "ABERTO") {
      return {
        to: `/solicitacoes/${existing.id}`,
        message: "A edição fica disponível enquanto o status é Aberto.",
        kind: "warning" as const,
      }
    }
    return null
  }, [editing, existing, ready, user])

  useEffect(() => {
    if (!blocked) return
    if (blocked.kind === "error") notice.error(blocked.message)
    else notice.warning(blocked.message)
  }, [blocked])

  if (!user || (editing && !ready)) return null
  if (blocked) return <Navigate to={blocked.to} replace />
  if (editing && !hydrated) return null

  return (
    <div className="mx-auto max-w-2xl">
      <AccentRule />
      <p className="text-sm text-muted-foreground">
        {editing
          ? `${existing?.code} · aberta por ${requesterName(existing?.requesterId ?? "")}`
          : `Será registrada em nome de ${user.name}, com status Aberto.`}
      </p>
      <form
        className="mt-6 rounded-lg border bg-card p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (submitting) return
          const message = invalidDraft(draft)
          if (message) {
            notice.warning(message)
            return
          }
          setSubmitting(true)
          const action = existing
            ? update(existing.id, draft)
            : create(draft)
          void action.then((result) => {
            setSubmitting(false)
            if (!result.ok) {
              notice.error(result.message)
              return
            }
            notice.success(existing ? `${existing.code} atualizada.` : `${result.code} registrada.`)
            navigate(existing ? `/solicitacoes/${existing.id}` : "/solicitacoes")
          })
        }}
      >
        <SolicitationFields draft={draft} onChange={setDraft} />
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="h-11 text-sm sm:h-9" disabled={submitting}>
            {editing ? "Salvar alterações" : "Registrar solicitação"}
          </Button>
          <Button type="button" variant="outline" className="h-11 text-sm sm:h-9" asChild>
            <Link to={existing ? `/solicitacoes/${existing.id}` : "/solicitacoes"}>
              Cancelar
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
