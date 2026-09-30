import type { SupabaseClient } from "@supabase/supabase-js"
import {
  CATEGORIES,
  nextStatus,
  type Category,
  type RequestStatus,
  type SessionUser,
  type Solicitation,
} from "../domain.js"
import { HttpError } from "../lib/http.js"
import { userClient } from "../lib/supabase.js"

const columns = `
  id, code, title, description, category, requester_id, status, created_at, updated_at,
  profiles ( name )
`

type ProfileEmbed = { name: string } | { name: string }[] | null

type Row = {
  id: string
  code: string
  title: string
  description: string
  category: string
  requester_id: string
  status: string
  created_at: string
  updated_at: string
  profiles: ProfileEmbed
}

export type Actor = Pick<SessionUser, "id" | "role"> & { accessToken: string }

function asCategory(value: string): Category {
  if ((CATEGORIES as readonly string[]).includes(value)) return value as Category
  throw new HttpError(500, "Não foi possível consultar a solicitação.")
}

function asStatus(value: string): RequestStatus {
  if (value === "ABERTO" || value === "EM_ATENDIMENTO" || value === "CONCLUIDO") return value
  throw new HttpError(500, "Não foi possível consultar a solicitação.")
}

function requesterName(profiles: ProfileEmbed) {
  if (Array.isArray(profiles)) return profiles[0]?.name ?? "Colaborador"
  return profiles?.name ?? "Colaborador"
}

function toSolicitation(row: Row): Solicitation {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    category: asCategory(row.category),
    requesterId: row.requester_id,
    requesterName: requesterName(row.profiles),
    status: asStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function fail(error: { code?: string; message?: string } | null): never {
  if (error?.code === "23514" || error?.code === "P0001") {
    throw new HttpError(403, "Não foi possível alterar esta solicitação.")
  }
  if (error?.code === "22P02") throw new HttpError(400, "Identificador inválido.")
  throw new HttpError(500, "Não foi possível concluir agora.")
}

function scoped(client: SupabaseClient, actor: Actor) {
  let query = client.from("solicitations").select(columns)
  if (actor.role !== "admin") query = query.eq("requester_id", actor.id)
  return query
}

async function loadOne(actor: Actor, id: string) {
  const { data, error } = await scoped(userClient(actor.accessToken), actor).eq("id", id).maybeSingle()
  if (error) fail(error)
  if (!data) throw new HttpError(404, "Solicitação não encontrada.")
  return toSolicitation(data as Row)
}

export async function listSolicitations(actor: Actor) {
  const { data, error } = await scoped(userClient(actor.accessToken), actor).order("created_at", {
    ascending: false,
  })
  if (error) fail(error)
  return ((data ?? []) as Row[]).map(toSolicitation)
}

export async function createSolicitation(
  actor: Actor,
  draft: { title: string; description: string; category: Category },
) {
  const { data, error } = await userClient(actor.accessToken)
    .from("solicitations")
    .insert({
      title: draft.title,
      description: draft.description,
      category: draft.category,
      requester_id: actor.id,
    })
    .select("id")
    .maybeSingle()
  if (error) fail(error)
  if (!data) throw new HttpError(500, "Não foi possível registrar a solicitação.")
  return loadOne(actor, data.id)
}

export async function updateSolicitation(
  actor: Actor,
  id: string,
  draft: { title: string; description: string; category: Category },
) {
  const current = await loadOne(actor, id)
  if (current.status !== "ABERTO") {
    throw new HttpError(403, "A edição fica disponível enquanto o status é Aberto.")
  }
  let query = userClient(actor.accessToken)
    .from("solicitations")
    .update({
      title: draft.title,
      description: draft.description,
      category: draft.category,
    })
    .eq("id", id)
    .eq("status", "ABERTO")
  if (actor.role !== "admin") query = query.eq("requester_id", actor.id)
  const { data, error } = await query.select("id")
  if (error) fail(error)
  if (!data?.length) throw new HttpError(404, "Solicitação não encontrada.")
  return loadOne(actor, id)
}

export async function removeSolicitation(actor: Actor, id: string) {
  const current = await loadOne(actor, id)
  if (current.status !== "ABERTO") throw new HttpError(403, "Só é possível excluir uma solicitação aberta.")
  let query = userClient(actor.accessToken).from("solicitations").delete().eq("id", id).eq("status", "ABERTO")
  if (actor.role !== "admin") query = query.eq("requester_id", actor.id)
  const { data, error } = await query.select("id")
  if (error) fail(error)
  if (!data?.length) throw new HttpError(404, "Solicitação não encontrada.")
  return current
}

export async function advanceSolicitation(actor: Actor, id: string) {
  const current = await loadOne(actor, id)
  const status = nextStatus(current.status)
  if (!status) throw new HttpError(409, "Esta solicitação já está concluída.")
  let query = userClient(actor.accessToken)
    .from("solicitations")
    .update({ status })
    .eq("id", id)
    .eq("status", current.status)
  if (actor.role !== "admin") query = query.eq("requester_id", actor.id)
  const { data, error } = await query.select("id")
  if (error) fail(error)
  if (!data?.length) throw new HttpError(404, "Solicitação não encontrada.")
  return loadOne(actor, id)
}
