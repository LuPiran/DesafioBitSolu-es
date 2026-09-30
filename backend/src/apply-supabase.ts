import "dotenv/config"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import pg from "pg"

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Defina ${name}.`)
  return value
}

async function applyWithDatabase(sql: string) {
  const client = new pg.Client({
    connectionString: required("SUPABASE_DB_URL"),
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  try {
    await client.query(sql)
  } finally {
    await client.end()
  }
}

async function applyWithServiceRole(sql: string) {
  const base = required("SUPABASE_URL").replace(/\/$/, "")
  const headers = {
    "Content-Type": "application/json",
    apikey: required("SUPABASE_SERVICE_ROLE_KEY"),
    Authorization: `Bearer ${required("SUPABASE_SERVICE_ROLE_KEY")}`,
  }
  const targets = [`${base}/pg/query`, `${base}/pg-meta/default/query`]
  let status = 0
  for (const target of targets) {
    const response = await fetch(target, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: sql }),
    })
    status = response.status
    if (response.ok) return
  }
  throw new Error(
    `Não foi possível aplicar o schema (HTTP ${status}). Defina SUPABASE_DB_URL com a URI do banco em Project Settings → Database.`,
  )
}

export async function applySupabaseSchema() {
  const sql = await readFile(path.resolve(process.cwd(), "../database/supabase.sql"), "utf8")
  if (process.env.SUPABASE_DB_URL?.trim()) {
    await applyWithDatabase(sql)
    return
  }
  await applyWithServiceRole(sql)
}

const isDirect = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirect) {
  applySupabaseSchema()
    .then(() => {
      console.log("Schema aplicado no Supabase.")
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
