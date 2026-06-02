import dotenv from "dotenv"
import { PrismaClient, Prisma } from "@prisma/client"
import { residentIdGenerator } from "./middleware/residentIdGenerator"
dotenv.config()

// PrismaClient automatically uses `directUrl` from schema.prisma
const prisma = new PrismaClient()

prisma.$use(residentIdGenerator as Prisma.Middleware)

export default prisma
