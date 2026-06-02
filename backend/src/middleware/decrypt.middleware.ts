// src/middleware/decrypt.middleware.ts
import { Request, Response, NextFunction } from "express"
import { decrypt } from "../utils/crypto.util"

export const decryptFields =
  (fields: string[]) =>
  (_req: Request, res: Response, next: NextFunction) => {
    const oldJson = res.json.bind(res)

    res.json = (data: any) => {
      if (!data) return oldJson(data)

      const decryptObject = (obj: any) => {
        fields.forEach((field) => {
          if (obj[field] && typeof obj[field] === "string") {
            try {
              const decrypted = decrypt(obj[field])

              // 👇 parse JSON if possible
              try {
                obj[field] = JSON.parse(decrypted)
              } catch {
                obj[field] = decrypted // fallback to string
              }
            } catch {
              // ignore if not encrypted
            }
          }
        })
      }

      if (Array.isArray(data)) {
        data.forEach(decryptObject)
      } else {
        decryptObject(data)
      }

      return oldJson(data)
    }

    next()
  }
