function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Defina ${name}.`)
  return value
}

const nodeEnv = process.env.NODE_ENV?.trim() || "development"
const port = Number(process.env.PORT ?? 3333)
const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "")
const supabaseAnonKey = required("SUPABASE_ANON_KEY")

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT precisa ser um número entre 1 e 65535.")
}

if (!/^https:\/\//.test(supabaseUrl)) {
  throw new Error("SUPABASE_URL precisa ser HTTPS.")
}

export const config = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  host: process.env.HOST?.trim() || (nodeEnv === "production" ? "0.0.0.0" : "127.0.0.1"),
  port,
  appOrigin: required("APP_ORIGIN").replace(/\/$/, ""),
  supabaseUrl,
  supabaseAnonKey,
  cookieSecure: process.env.COOKIE_SECURE === "true",
}

export function allowedOrigins() {
  const origins = new Set([config.appOrigin])
  const url = new URL(config.appOrigin)
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    const twin = new URL(url)
    twin.hostname = url.hostname === "localhost" ? "127.0.0.1" : "localhost"
    origins.add(twin.origin)
  }
  return origins
}
