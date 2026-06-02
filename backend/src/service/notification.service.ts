import prisma from "../prisma"
import { getIO } from "../socket"
import { encrypt } from "../utils/crypto.util"
import { Role } from "@prisma/client"

interface NotificationContent {
  title: string
  message: string
  from: string
  type: "success" | "info" | "warning"
}

export const sendNotification = async (
  resident_id: string,
  role: Role,
  content: NotificationContent
) => {

  const notification = await prisma.notification.create({
    data: {
      resident_id,
      content: encrypt(JSON.stringify(content)),
      receiver: role,
    },
  })

  const payload = {
    id: notification.id,
    resident_id: notification.resident_id,
    content,
    mark_read: notification.mark_read,
    timestamp: notification.timestamp,
    receiver: notification.receiver,
  }

  const io = getIO()

  if (resident_id && role === "resident") {
    io.to(`user:${resident_id}`).emit("new-notification", payload)
  }

  if (role !== "resident") {
    io.to(`role:${role}`).emit("new-notification", payload)
  }

  return payload
}