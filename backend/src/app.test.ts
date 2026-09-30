import "dotenv/config"
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import request from "supertest"
import { createApp } from "./app.js"

const app = createApp()

describe("API", () => {
  it("responde saúde sem autenticação", async () => {
    const response = await request(app).get("/api/health")
    assert.equal(response.status, 200)
    assert.deepEqual(response.body, { ok: true })
  })

  it("exige sessão para listar solicitações", async () => {
    const response = await request(app).get("/api/solicitations")
    assert.equal(response.status, 401)
    assert.equal(response.body.message, "Sessão expirada.")
  })

  it("responde 404 para uma rota inexistente", async () => {
    const response = await request(app).get("/api/nao-existe")
    assert.equal(response.status, 404)
  })

  it("recusa login sem o cabeçalho do portal", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "ana@portal.interno", password: "portal123" })
    assert.equal(response.status, 403)
  })

  it("recusa login vindo de outra origem", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://exemplo.invalid")
      .set("X-Portal-Request", "1")
      .send({ email: "ana@portal.interno", password: "portal123" })
    assert.equal(response.status, 403)
    assert.equal(response.body.message, "Origem não aceita.")
  })

  it("não chama o Supabase quando o corpo do login é inválido", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("X-Portal-Request", "1")
      .send({ email: "nao-e-email", password: "123", role: "admin" })
    assert.equal(response.status, 401)
    assert.equal(response.body.message, "E-mail ou senha não conferem.")
  })
})
