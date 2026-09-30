import { createClient } from "@supabase/supabase-js"
import { config } from "../config.js"

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const

export function anonClient() {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: authOptions,
  })
}

export function userClient(accessToken: string) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    accessToken: async () => accessToken,
    auth: authOptions,
  })
}
