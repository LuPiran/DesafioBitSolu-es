import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { draftSchema, idSchema, loginSchema } from "./validators.js"

const draft = {
  title: "Headset do atendimento",
  description: "Comprar um headset para o atendimento telefônico.",
  category: "Compras" as const,
}

describe("login", () => {
  it("normaliza o e-mail", () => {
    const parsed = loginSchema.parse({
      email: "  Ana.Costa@Portal.Interno ",
      password: "portal123",
    })
    assert.equal(parsed.email, "ana.costa@portal.interno")
  })

  it("recusa senha curta e e-mail inválido", () => {
    assert.equal(loginSchema.safeParse({ email: "ana", password: "portal123" }).success, false)
    assert.equal(loginSchema.safeParse({ email: "ana@portal.interno", password: "curta" }).success, false)
  })

  it("recusa campo extra no corpo", () => {
    const parsed = loginSchema.safeParse({
      email: "ana@portal.interno",
      password: "portal123",
      role: "admin",
    })
    assert.equal(parsed.success, false)
  })
})

describe("rascunho da solicitação", () => {
  it("aceita um rascunho válido", () => {
    assert.equal(draftSchema.safeParse(draft).success, true)
  })

  it("corta espaços e exige tamanho mínimo", () => {
    const parsed = draftSchema.safeParse({ ...draft, title: "  abcde  " })
    assert.equal(parsed.success, true)
    if (parsed.success) assert.equal(parsed.data.title, "abcde")
    assert.equal(draftSchema.safeParse({ ...draft, title: "  ab  " }).success, false)
    assert.equal(draftSchema.safeParse({ ...draft, description: "curta demais" }).success, false)
  })

  it("só aceita as categorias do portal", () => {
    assert.equal(draftSchema.safeParse({ ...draft, category: "Jurídico" }).success, false)
  })

  it("não aceita o cliente escolher o solicitante", () => {
    const parsed = draftSchema.safeParse({ ...draft, requesterId: "11111111-1111-4111-8111-111111111111" })
    assert.equal(parsed.success, false)
  })
})

describe("identificador", () => {
  it("aceita um UUID", () => {
    assert.equal(idSchema.safeParse("369fc218-b8b3-4592-bca4-37b05041e94e").success, true)
  })

  it("recusa um código no lugar do id", () => {
    assert.equal(idSchema.safeParse("SOL-0013").success, false)
  })
})
