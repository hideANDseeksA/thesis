import { Server as HttpServer } from "http"
import { Server, Socket } from "socket.io"
import jwt from "jsonwebtoken"
import prisma from "../prisma"

let io: Server

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: { origin: "*" },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error("Access token missing"))

      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!
      ) as { id: string; role: string }

      // 🔍 Fetch user from DB to get resident_id
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          role: true,
          resident_id: true,
        },
      })

      if (!user) {
        return next(new Error("User not found"))
      }

      socket.data.user = user
      next()
    } catch {
      next(new Error("Invalid or expired token"))
    }
  })

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user!

    // ✅ Always join auth user room
    socket.join(`user:${user.id}`)

    // ✅ Join resident room if exists
    if (user.resident_id) {
      socket.join(`user:${user.resident_id}`)
    }

    // ✅ Join role room
    socket.join(`role:${user.role}`)

    console.log("🔌 Connected:", user.id)
    console.log("Rooms:", {
      user: `user:${user.id}`,
      resident: user.resident_id ? `user:${user.resident_id}` : "none",
      role: `role:${user.role}`,
    })

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${user.id}`)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized")
  return io
}
