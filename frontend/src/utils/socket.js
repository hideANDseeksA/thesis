import { io } from "socket.io-client"

let socket = null

export const connectSocket = (token) => {
  socket = io(import.meta.env.VITE_API_URL, {
    auth: {
      token: token,
    },
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not connected")
  }
  return socket
}