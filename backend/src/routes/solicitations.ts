import { Router } from "express"
import { ZodError } from "zod"
import { asyncHandler, HttpError } from "../lib/http.js"
import { requireAuth } from "../middleware/auth.js"
import {
  advanceSolicitation,
  createSolicitation,
  listSolicitations,
  removeSolicitation,
  updateSolicitation,
} from "../services/solicitations.js"
import { draftSchema, idSchema } from "../validators.js"

export const solicitationsRouter = Router()

solicitationsRouter.use(requireAuth)

function actorOf(req: { authUser?: { id: string; role: "padrao" | "admin" }; accessToken?: string }) {
  if (!req.authUser || !req.accessToken) throw new HttpError(401, "Sessão expirada.")
  return { id: req.authUser.id, role: req.authUser.role, accessToken: req.accessToken }
}

function parseDraft(body: unknown) {
  try {
    return draftSchema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(400, error.issues[0]?.message ?? "Dados inválidos.")
    }
    throw error
  }
}

function parseId(value: string | undefined) {
  const parsed = idSchema.safeParse(value)
  if (!parsed.success) throw new HttpError(400, "Identificador inválido.")
  return parsed.data
}

solicitationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({ items: await listSolicitations(actorOf(req)) })
  }),
)

solicitationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const created = await createSolicitation(actorOf(req), parseDraft(req.body))
    res.status(201).json({ item: created })
  }),
)

solicitationsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const updated = await updateSolicitation(actorOf(req), parseId(req.params.id), parseDraft(req.body))
    res.json({ item: updated })
  }),
)

solicitationsRouter.post(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const updated = await advanceSolicitation(actorOf(req), parseId(req.params.id))
    res.json({ item: updated })
  }),
)

solicitationsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const removed = await removeSolicitation(actorOf(req), parseId(req.params.id))
    res.json({ item: removed })
  }),
)
