import type { CookieOptions, Response } from "express"
import { config } from "../config.js"

export const ACCESS_COOKIE = "portal_access"
export const REFRESH_COOKIE = "portal_refresh"

const base: CookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: "lax",
  path: "/",
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string; expiresIn: number },
) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    maxAge: tokens.expiresIn * 1000,
  })
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: 60 * 60 * 24 * 7 * 1000,
  })
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, base)
  res.clearCookie(REFRESH_COOKIE, base)
}
