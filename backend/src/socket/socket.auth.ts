import jwt from "jsonwebtoken"
import { Socket } from "socket.io"

export type Role = "admin" | "staff" | "resident"

export interface SocketUser {
  id: string
  role: Role
}

declare module "socket.io" {
  interface Socket {
    user?: SocketUser
  }
}

export const socketAuth = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) throw new Error("Unauthorized")

    const user = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as SocketUser

    socket.user = user
    next()
  } catch {
    next(new Error("Unauthorized"))
  }
}
