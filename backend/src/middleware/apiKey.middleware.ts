import { Request, Response, NextFunction } from "express";

export const verifyApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"]; // 🔑 read from headers

  if (!apiKey) {
    return res.status(401).json({ message: "API key is missing" });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ message: "Invalid API key" });
  }

  next(); // ✅ allow request
};