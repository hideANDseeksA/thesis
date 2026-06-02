import { Request, Response } from "express"
import prisma from "../prisma"
import { uploadToSupabase } from "../utils/supabaseUpload.util"
import { generateSignedUrl } from "../utils/supabaseUrl.util"
import { deleteFromSupabase } from "../utils/supabaseDelete.util"
import { apiCache } from "../utils/apiCache"

/* =========================================
   CREATE OR UPDATE (UPSERT – SINGLETON)
========================================= */
export const upsertsystem_setting = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      web_name,
      web_color,
      barangay_status,
      residentPrefix,
      residentNumberType,
      residentNumberLength,
    } = req.body

    const existing = await prisma.system_setting.findUnique({
      where: { id: 1 },
    })

    let logo_url = existing?.logo_url ?? null

    if (req.file) {
      if (existing?.logo_url) {
        await deleteFromSupabase({
          bucket: "system_setting",
          path: existing.logo_url,
        })
      }

      logo_url = await uploadToSupabase({
        bucket: "system_setting",
        file: req.file,
      })
    }

    // 🔥 Detect changes
    const prefixChanged =
      existing?.residentPrefix !== residentPrefix

    const typeChanged =
      existing?.residentNumberType !== residentNumberType

    const lengthChanged =
      existing?.residentNumberLength !==
      (residentNumberLength ? Number(residentNumberLength) : null)

    const shouldResetResidentNumber =
      prefixChanged || typeChanged || lengthChanged

    const system_setting = await prisma.system_setting.upsert({
      where: { id: 1 },
      update: {
        logo_url,
        web_name,
        web_color,
        barangay_status,
        residentPrefix,
        residentNumberType,
        residentNumberLength: residentNumberLength
          ? Number(residentNumberLength)
          : undefined,

        // ✅ reset logic here
        residentNumber: shouldResetResidentNumber
          ? 1
          : existing?.residentNumber,
      },
      create: {
        id: 1,
        logo_url,
        web_name,
        web_color,
        barangay_status,
        residentPrefix,
        residentNumberType,
        residentNumberLength: residentNumberLength
          ? Number(residentNumberLength)
          : undefined,

        // ✅ first creation always starts at 1
        residentNumber: 1,
      },
    })
    apiCache.clearAll();
    res.status(200).json(system_setting)
    console.log("Role: staff");
    console.log("Upserted system setting with ID:", system_setting.id);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}


/* =========================================
   READ (GET SINGLE SYSTEM SETTING)
========================================= */
export const getsystem_setting = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await apiCache.get(
      "system_setting",
      async () => {
        const setting = await prisma.system_setting.findUnique({
          where: { id: 1 },
        });

        if (!setting) return null;

        return {
          ...setting,
          logo_url: setting.logo_url
            ? await generateSignedUrl(setting.logo_url, 60 * 60 * 24)
            : null,
        };
      },
      60 * 60 * 24 // 24 hours cache
    );

    res.status(200).json(result);
    console.log("Role: staff");
    console.log("Fetched system setting with ID:", result?.id);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};

/* =========================================
   DELETE (OPTIONAL – USE WITH CARE)
========================================= */
export const deletesystem_setting = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const existing = await prisma.system_setting.findUnique({
      where: { id: 1 },
    })

    if (!existing) {
      res.status(404).json({ error: "System setting not found" })
      return
    }

    if (existing.logo_url) {
      await deleteFromSupabase({
        bucket: "system_setting",
        path: existing.logo_url,
      })
    }

    await prisma.system_setting.delete({
      where: { id: 1 },
    })

    res.status(200).json({ message: "System setting deleted successfully" })
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}
