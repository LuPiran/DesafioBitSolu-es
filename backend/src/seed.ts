import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { pathToFileURL } from "node:url"
import type { Category, RequestStatus } from "./domain.js"

const people = [
  {
    username: "ana.costa",
    name: "Ana Costa",
    email: "ana.costa@portal.interno",
    password: "portal123",
    role: "admin" as const,
  },
  {
    username: "bruno.lima",
    name: "Bruno Lima",
    email: "bruno.lima@portal.interno",
    password: "portal123",
    role: "padrao" as const,
  },
]

const records: Array<{
  owner: "ana.costa@portal.interno" | "bruno.lima@portal.interno"
  title: string
  description: string
  category: Category
  status: RequestStatus
}> = [
  {
    owner: "ana.costa@portal.interno",
    title: "Acesso ao repositório do cliente Atlas",
    description: "Liberar o acesso de leitura ao repositório do cliente Atlas para o time.",
    category: "TI",
    status: "CONCLUIDO",
  },
  {
    owner: "ana.costa@portal.interno",
    title: "Renovação do Microsoft 365",
    description: "Renovar as licenças do Microsoft 365 antes do vencimento.",
    category: "TI",
    status: "CONCLUIDO",
  },
  {
    owner: "ana.costa@portal.interno",
    title: "Nota da Hostinger no contas a pagar",
    description: "Lançar a nota da Hostinger no contas a pagar deste mês.",
    category: "Financeiro",
    status: "EM_ATENDIMENTO",
  },
  {
    owner: "bruno.lima@portal.interno",
    title: "Homologação fora do ar",
    description: "O ambiente de homologação está fora do ar desde a manhã.",
    category: "TI",
    status: "EM_ATENDIMENTO",
  },
  {
    owner: "bruno.lima@portal.interno",
    title: "Ar-condicionado da sala de desenvolvimento",
    description: "O ar-condicionado da sala de desenvolvimento parou de gelar.",
    category: "Infraestrutura",
    status: "EM_ATENDIMENTO",
  },
  {
    owner: "ana.costa@portal.interno",
    title: "Atestado do dia 26 no ponto",
    description: "Registrar o atestado do dia 26 no controle de ponto.",
    category: "RH",
    status: "ABERTO",
  },
  {
    owner: "bruno.lima@portal.interno",
    title: "Inclusão de dependente no plano de saúde",
    description: "Incluir o dependente no plano de saúde a partir deste mês.",
    category: "RH",
    status: "ABERTO",
  },
  {
    owner: "bruno.lima@portal.interno",
    title: "Headset do atendimento",
    description: "Comprar um headset para o atendimento telefônico.",
    category: "Compras",
    status: "ABERTO",
  },
  {
    owner: "bruno.lima@portal.interno",
    title: "Nobreak da sala de servidores",
    description: "Substituir o nobreak da sala de servidores, que não segura a carga.",
    category: "Infraestrutura",
    status: "ABERTO",
  },
  {
    owner: "ana.costa@portal.interno",
    title: "Certificado do portal do cliente Norte",
    description: "Renovar o certificado do portal do cliente Norte.",
    category: "TI",
    status: "ABERTO",
  },
  {
    owner: "ana.costa@portal.interno",
    title: "Reembolso da visita a Campinas",
    description: "Reembolsar as despesas da visita a Campinas.",
    category: "Financeiro",
    status: "ABERTO",
  },
  {
    owner: "bruno.lima@portal.interno",
    title: "Toner da impressora do financeiro",
    description: "Comprar toner para a impressora do financeiro.",
    category: "Compras",
    status: "ABERTO",
  },
  {
    owner: "ana.costa@portal.interno",
    title: "Redesign do painel Crextio",
    description: "Teste da aplicação",
    category: "RH",
    status: "ABERTO",
  },
]

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Defina ${name}.`)
  return value
}

function adminClient() {
  return createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

async function ensureUsers() {
  const admin = adminClient()
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listed.error) throw new Error("Não foi possível consultar os usuários do Supabase.")
  const ids = new Map<string, string>()

  for (const person of people) {
    const existing = listed.data.users.find((user) => user.email?.toLowerCase() === person.email)
    const metadata = { name: person.name, username: person.username }
    const appMetadata = { role: person.role }
    const saved = existing
      ? await admin.auth.admin.updateUserById(existing.id, {
          password: person.password,
          email_confirm: true,
          user_metadata: metadata,
          app_metadata: appMetadata,
        })
      : await admin.auth.admin.createUser({
          email: person.email,
          password: person.password,
          email_confirm: true,
          user_metadata: metadata,
          app_metadata: appMetadata,
        })
    if (saved.error || !saved.data.user) {
      throw new Error(`Não foi possível gravar ${person.email}.`)
    }
    ids.set(person.email, saved.data.user.id)
    const profile = await admin.from("profiles").upsert(
      {
        id: saved.data.user.id,
        name: person.name,
        username: person.username,
        email: person.email,
        role: person.role,
      },
      { onConflict: "id" },
    )
    if (profile.error) throw new Error("Não foi possível gravar os perfis. Aplique database/supabase.sql.")
  }

  return ids
}

async function advance(accessToken: string, id: string, steps: number) {
  const client = createClient(required("SUPABASE_URL"), required("SUPABASE_ANON_KEY"), {
    accessToken: async () => accessToken,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  let status = "ABERTO"
  for (let step = 0; step < steps; step += 1) {
    const next = status === "ABERTO" ? "EM_ATENDIMENTO" : "CONCLUIDO"
    const updated = await client.from("solicitations").update({ status: next }).eq("id", id).eq("status", status)
    if (updated.error) throw new Error("Não foi possível ajustar o status inicial.")
    status = next
  }
}

export async function seedDemo() {
  const ids = await ensureUsers()
  const admin = adminClient()
  const existing = await admin.from("solicitations").select("id", { count: "exact", head: true })
  if (existing.error) throw new Error("Não foi possível consultar as solicitações. Aplique database/supabase.sql.")
  if ((existing.count ?? 0) > 0) return

  const signed = await createClient(required("SUPABASE_URL"), required("SUPABASE_ANON_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).auth.signInWithPassword({ email: "ana.costa@portal.interno", password: "portal123" })
  const adminToken = signed.data.session?.access_token
  if (!adminToken) throw new Error("Não foi possível entrar com a conta de administração.")

  for (const record of records) {
    const ownerId = ids.get(record.owner)
    if (!ownerId) throw new Error("Usuário da solicitação não encontrado.")
    const owner = createClient(required("SUPABASE_URL"), required("SUPABASE_ANON_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const session = await owner.auth.signInWithPassword({
      email: record.owner,
      password: "portal123",
    })
    const token = session.data.session?.access_token
    if (!token) throw new Error(`Não foi possível entrar com ${record.owner}.`)
    const writer = createClient(required("SUPABASE_URL"), required("SUPABASE_ANON_KEY"), {
      accessToken: async () => token,
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const inserted = await writer
      .from("solicitations")
      .insert({
        title: record.title,
        description: record.description,
        category: record.category,
        requester_id: ownerId,
      })
      .select("id")
      .single()
    if (inserted.error || !inserted.data) throw new Error(`Não foi possível registrar ${record.title}.`)
    const steps = record.status === "CONCLUIDO" ? 2 : record.status === "EM_ATENDIMENTO" ? 1 : 0
    if (steps > 0) await advance(adminToken, inserted.data.id, steps)
  }
}

const isDirect = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirect) {
  seedDemo()
    .then(() => {
      console.log("Usuários e solicitações gravados no Supabase.")
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
