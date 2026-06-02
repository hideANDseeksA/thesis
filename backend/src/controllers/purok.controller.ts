import { Request, Response } from "express"
import prisma from "../prisma"
import { apiCache } from "../utils/apiCache"

/* CREATE */
export const createPurok = async (req: Request, res: Response): Promise<void> => {
  try {
    const purok = await prisma.purok.create({
      data: req.body,
    })
    apiCache.clear("puroks_all"); // ❗ invalidate cache
    res.status(201).json(purok)
    console.log("Role: staff");
    console.log("Created new purok with ID:", purok.id);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}

/* READ ALL */
export const getPurok = async (_req: Request, res: Response): Promise<void> => {
  try {
    const puroks = await apiCache.get("puroks_all", async () => {
      return await prisma.purok.findMany();
    }, 60 * 60 * 24); // 24 hours cache

    res.json(puroks);
    console.log("Role: staff");
    console.log("Fetched puroks list. Total puroks in this query:", puroks.length);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};



/* UPDATE */
export const updatePurok = async (req: Request, res: Response): Promise<void> => {
  try {
    const purok = await prisma.purok.update({
      where: { id: req.params.id },
      data: req.body,
    })
    apiCache.clear("puroks_all"); // ❗ invalidate cache
    console.log("Role: staff");
    console.log("Updated purok with ID:", purok.id);
    res.json(purok)
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}

/* DELETE */
export const deletePurok = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.purok.delete({
      where: { id: req.params.id },
    })
    console.log("Role: staff");
    console.log("Deleted purok with ID:", req.params.id);
    apiCache.clear("puroks_all"); // ❗ invalidate cache
    res.json({ message: "purok deleted successfully" })
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}
  