import { Request, Response } from "express"
import prisma from "../prisma"

/* CREATE */
export const createDocument_types = async (req: Request, res: Response): Promise<void> => {
  try {
    const document_types = await prisma.document_types.create({
      data: req.body,
    })
    res.status(201).json(document_types)
    console.log("Role: staff");
    console.log("Created new document type with ID:", document_types.id);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}

/* READ ALL */
export const getDocument_types = async (_req: Request, res: Response): Promise<void> => {
  try {
    const document_typess = await prisma.document_types.findMany()
    res.json(document_typess)
    console.log("Role: staff");
    console.log("Fetched document types list. Total document types in this query:", document_typess.length);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}



/* UPDATE */
export const updateDocument_types = async (req: Request, res: Response): Promise<void> => {
  try {
    const document_types = await prisma.document_types.update({
      where: { id: req.params.id },
      data: req.body,
    })
    console.log("Role: staff");
    console.log("Updated document type with ID:", document_types.id);
    res.json(document_types)
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}

/* DELETE */
export const deleteDocument_types = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.document_types.delete({
      where: { id: req.params.id },
    })
    res.json({ message: "document_types deleted successfully" })
    console.log("Role: staff");
    console.log("Deleted document type with ID:", req.params.id);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}
