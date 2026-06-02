import { Request, Response, NextFunction } from "express"
import { ZodSchema, ZodError } from "zod"

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body)
      req.body = result
      next()
    } catch (error: unknown) {
      console.error("❌ Validation Error:")
      console.error("Route:", req.method, req.originalUrl)
      console.error("Body:", JSON.stringify(req.body, null, 2))

      // ✅ Proper Zod error handling
      if (error instanceof ZodError) {
        console.error("Zod Issues:", error.issues)

        return res.status(400).json({
          message: "Validation error",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        })
      }

      // ❗ Fallback (not Zod error)
      console.error("Unknown Error:", error)

      return res.status(500).json({
        message: "Internal server error",
      })
    }
  }