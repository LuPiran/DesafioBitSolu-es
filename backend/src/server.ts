import "dotenv/config"
import { createApp } from "./app.js"
import { config } from "./config.js"

const health = await fetch(`${config.supabaseUrl}/auth/v1/health`, {
  headers: { apikey: config.supabaseAnonKey },
})
if (!health.ok) {
  throw new Error("Não foi possível falar com o Supabase.")
}

const app = createApp()

const server = app.listen(config.port, config.host, () => {
  console.log(`API em http://${config.host}:${config.port}`)
})

function shutdown() {
  server.close()
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
