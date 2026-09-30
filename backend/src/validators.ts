import { z } from "zod"
import { CATEGORIES } from "./domain.js"

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
}).strict()

export const draftSchema = z.object({
  title: z.string().trim().min(5, "O título precisa ter pelo menos 5 caracteres.").max(120),
  description: z
    .string()
    .trim()
    .min(15, "Descreva a demanda com pelo menos 15 caracteres.")
    .max(2000),
  category: z.enum(CATEGORIES),
}).strict()

export const idSchema = z.uuid("Identificador inválido.")
