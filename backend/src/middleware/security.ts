import type { NextFunction, Request, Response } from "express"
import rateLimit from "express-rate-limit"
import { allowedOrigins } from "../config.js"
import { HttpError } from "../lib/http.js"

const windowMs = 15 * 60 * 1000

export const loginRateLimit = rateLimit({
  windowMs,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Muitas tentativas. Espere alguns minutos e tente de novo." },
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas requisições em sequência. Espere um instante." },
})

export function originGuard(req: Request, _res: Response, next: NextFunction) {
  const method = req.method.toUpperCase()
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next()
    return
  }
  const origin = req.get("origin")
  if (origin && !allowedOrigins().has(origin)) {
    next(new HttpError(403, "Origem não aceita."))
    return
  }
  if (req.get("x-portal-request") !== "1") {
    next(new HttpError(403, "Requisição recusada."))
    return
  }
  next()
}
