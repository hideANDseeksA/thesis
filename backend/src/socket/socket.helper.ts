import { Server } from "socket.io"

/**
 * Socket roles
 */
export type SocketRole = "admin" | "staff" | "resident"

let io: Server | null = null

/* =============================
   INIT
============================= */
export const initSocket = (server: any): Server => {
  io = new Server(server, {
    cors: { origin: "*" },
  })

  return io
}

/* =============================
   GET INSTANCE
============================= */
export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO not initialized")
  }
  return io
}

/* =============================
   ROOM HELPERS
============================= */

/** Admin + Staff room */
export const ADMIN_ROOM = "admins"

/** Resident private room */
export const residentRoom = (residentId: string) =>
  `resident:${residentId}`

/* =============================
   EMIT HELPERS
============================= */

/**
 * Emit new transaction (admins only)
 */
export const emitNewTransactionToAdmins = (payload: any) => {
  getIO().to(ADMIN_ROOM).emit("transaction:new", payload)
}

/**
 * Emit transaction update to a specific resident
 */
export const emitTransactionUpdate = (
  residentId: string,
  payload: any
) => {
  const io = getIO()

  // 🔔 Admins & staff
  io.to(ADMIN_ROOM).emit("transaction:update", payload)

  // 🔔 Specific resident
  io.to(residentRoom(residentId)).emit(
    "transaction:update",
    payload
  )
}


/**
 * Emit transaction completion
 */
export const emitTransactionCompleted = (
  residentId: string,
  transactionId: string
) => {
  const io = getIO()

  io.to(ADMIN_ROOM).emit("transaction:completed", {
    transactionId,
  })

  io.to(residentRoom(residentId)).emit(
    "transaction:completed",
    {
      transactionId,
      status: "completed",
    }
  )
}
