import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import helmet from "helmet"
import { ZodError } from "zod"
import { allowedOrigins, config } from "./config.js"
import { HttpError } from "./lib/http.js"
import { apiRateLimit, originGuard } from "./middleware/security.js"
import { authRouter } from "./routes/auth.js"
import { solicitationsRouter } from "./routes/solicitations.js"

export function createApp() {
  const app = express()
  app.disable("x-powered-by")
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1)
  app.use(helmet())
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins().has(origin)) {
          callback(null, true)
          return
        }
        callback(new HttpError(403, "Origem não aceita."))
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: "32kb" }))
  app.use(cookieParser())
  app.use("/api", apiRateLimit)
  app.use("/api", originGuard)
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true })
  })
  app.use("/api/auth", authRouter)
  app.use("/api/solicitations", solicitationsRouter)
  app.use((_req, _res, next) => {
    next(new HttpError(404, "Recurso não encontrado."))
  })
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ message: error.message })
      return
    }
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Dados inválidos." })
      return
    }
    if (!config.isProduction) console.error(error)
    res.status(500).json({ message: "Não foi possível concluir agora." })
  })
  return app
}
