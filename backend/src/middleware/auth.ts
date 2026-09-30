import type { NextFunction, Request, Response } from "express"
import type { SessionUser, UserRole } from "../domain.js"
import { HttpError } from "../lib/http.js"
import { config } from "../config.js"
import { anonClient, userClient } from "../lib/supabase.js"
import { ACCESS_COOKIE, REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "../lib/cookies.js"

type Issued = {
  user: SessionUser
  tokens: { accessToken: string; refreshToken: string; expiresIn: number }
}

function asRole(value: string | null | undefined): UserRole {
  return value === "admin" ? "admin" : "padrao"
}

async function profileFor(accessToken: string, userId: string): Promise<SessionUser | null> {
  const { data, error } = await userClient(accessToken)
    .from("profiles")
    .select("id, name, username, email, role")
    .eq("id", userId)
    .maybeSingle()
  if (error) throw new HttpError(500, "Não foi possível concluir agora.")
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    username: data.username,
    email: data.email,
    role: asRole(data.role),
  }
}

async function sessionFromAccess(accessToken: string): Promise<SessionUser | null> {
  const { data, error } = await anonClient().auth.getUser(accessToken)
  if (error || !data.user) return null
  return profileFor(accessToken, data.user.id)
}

export async function signIn(email: string, password: string): Promise<Issued | null> {
  const { data, error } = await anonClient().auth.signInWithPassword({ email, password })
  const session = data.session
  if (error || !session) return null
  const user = await profileFor(session.access_token, session.user.id)
  if (!user) return null
  return {
    user,
    tokens: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    },
  }
}

async function refreshSession(refreshToken: string): Promise<Issued | null> {
  const { data, error } = await anonClient().auth.refreshSession({ refresh_token: refreshToken })
  const session = data.session
  if (error || !session) return null
  const user = await profileFor(session.access_token, session.user.id)
  if (!user) return null
  return {
    user,
    tokens: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    },
  }
}

export async function revokeSession(accessToken: string | undefined) {
  if (!accessToken) return
  await fetch(`${config.supabaseUrl}/auth/v1/logout?scope=local`, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const access = req.cookies?.[ACCESS_COOKIE] as string | undefined
    const refresh = req.cookies?.[REFRESH_COOKIE] as string | undefined
    let user = access ? await sessionFromAccess(access) : null
    let token = access

    if (!user && refresh) {
      const renewed = await refreshSession(refresh)
      if (!renewed) {
        clearAuthCookies(res)
        throw new HttpError(401, "Sessão expirada.")
      }
      setAuthCookies(res, renewed.tokens)
      user = renewed.user
      token = renewed.tokens.accessToken
    }

    if (!user || !token) throw new HttpError(401, "Sessão expirada.")
    req.authUser = user
    req.accessToken = token
    next()
  } catch (error) {
    next(error)
  }
}
