// middleware/auth.middleware.ts
import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"

export const authenticate = (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    res.status(401).json({ error: "Token missing" })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: "Invalid token" })
  }
}
