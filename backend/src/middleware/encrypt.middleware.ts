// src/middleware/encrypt.middleware.ts
import { Request, Response, NextFunction } from "express"
import { encrypt } from "../utils/crypto.util"

const LOWERCASE_FIELDS = new Set([
  "f_name", "m_name", "l_name", "s_name", "md_name",
  "email_address", "b_place", "citizenship", "occupation",
  "remarks", "sector", "house_no"
])

const processField = (field: string, value: unknown, targetFields: string[]): unknown => {
  if (!targetFields.includes(field)) return value
  if (value === undefined || value === null) return value

  const str = typeof value === "object"
    ? JSON.stringify(value)
    : String(value)

  // ✅ Lowercase before encrypting
  const normalized = LOWERCASE_FIELDS.has(field) ? str.toLowerCase() : str

  return encrypt(normalized)
}

export const encryptFields =
  (fields: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.body) return next()

    // ✅ CASE 1: ARRAY BODY (bulk)
    if (Array.isArray(req.body)) {
      req.body = req.body.map((item) => {
        const copy = { ...item }
        fields.forEach((field) => {
          copy[field] = processField(field, copy[field], fields)
        })
        return copy
      })

      return next()
    }

    // ✅ CASE 2: OBJECT BODY (create / update)
    const copy = { ...req.body }
    fields.forEach((field) => {
      copy[field] = processField(field, copy[field], fields)
    })

    req.body = copy
    next()
  }