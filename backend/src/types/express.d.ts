export {}

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string
        name: string
        username: string
        email: string
        role: "padrao" | "admin"
      }
      accessToken?: string
    }
  }
}
