import { Server } from "socket.io"
import { socketAuth } from "./socket.auth"
import { ADMIN_ROOM, residentRoom } from "./socket.helper"

export const registerSocketEvents = (io: Server) => {
  io.use(socketAuth)

  io.on("connection", (socket) => {
    const user = socket.user!
    console.log(`Socket connected: ${user.id} (${user.role})`)

    // 🔐 Auto join rooms
    if (user.role === "admin" || user.role === "staff") {
      socket.join(ADMIN_ROOM)
    }

    if (user.role === "resident") {
      socket.join(residentRoom(user.id))
    }

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id)
    })
  })
}
