import { Router } from "express"
import { ZodError } from "zod"
import { ACCESS_COOKIE, clearAuthCookies, setAuthCookies } from "../lib/cookies.js"
import { asyncHandler, HttpError } from "../lib/http.js"
import { requireAuth, revokeSession, signIn } from "../middleware/auth.js"
import { loginRateLimit } from "../middleware/security.js"
import { loginSchema } from "../validators.js"

export const authRouter = Router()

authRouter.post(
  "/login",
  loginRateLimit,
  asyncHandler(async (req, res) => {
    let input: { email: string; password: string }
    try {
      input = loginSchema.parse(req.body)
    } catch (error) {
      if (error instanceof ZodError) throw new HttpError(401, "E-mail ou senha não conferem.")
      throw error
    }
    const session = await signIn(input.email, input.password)
    if (!session) throw new HttpError(401, "E-mail ou senha não conferem.")
    setAuthCookies(res, session.tokens)
    res.json({ user: session.user })
  }),
)

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const access = req.cookies?.[ACCESS_COOKIE] as string | undefined
    await revokeSession(access)
    clearAuthCookies(res)
    res.status(204).end()
  }),
)

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.authUser })
  }),
)
