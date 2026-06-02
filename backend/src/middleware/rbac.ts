import { Request, Response, NextFunction } from "express"

export type Role = "admin" | "staff" | "resident" | "healthworker"

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: Role
  }
}

/**
 * Role-Based Access Control Middleware
 * @param allowedRoles list of allowed roles
 */
export const rbac =
  (...allowedRoles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden: insufficient permissions",
      })
      return
    }

    next()
  }
