import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { nextStatus } from "./domain.js"

describe("transição de status", () => {
  it("avança de Aberto para Em atendimento", () => {
    assert.equal(nextStatus("ABERTO"), "EM_ATENDIMENTO")
  })

  it("avança de Em atendimento para Concluído", () => {
    assert.equal(nextStatus("EM_ATENDIMENTO"), "CONCLUIDO")
  })

  it("não deixa a solicitação concluída voltar", () => {
    assert.equal(nextStatus("CONCLUIDO"), null)
  })
})
