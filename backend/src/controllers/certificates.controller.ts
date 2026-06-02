import { Request, Response } from "express"
import prisma from "../prisma"
import { uploadToSupabase } from "../utils/supabaseUpload.util"
import { generateSignedUrl } from "../utils/supabaseUrl.util"
import { updateSupabaseFile } from "../utils/supabaseUpdate.util"
import { deleteFromSupabase } from "../utils/supabaseDelete.util"


export const createCertificates = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { template_name,template_requirements, template_price, requestType } = req.body
    const file = req.file

    if (!file) {
      res.status(400).json({ error: "Template file is required" })
      return
    }

    /* Upload once, reuse everywhere */
    const template_path = await uploadToSupabase({
      bucket: "certificate_template",
      file,
    })

    const certificate = await prisma.certificates.create({
      data: {
        template_name,
        template_requirements,
        template_price: template_price
          ? Number(template_price)
          : null,
        template_path,
        requestType:
          requestType === undefined
            ? true
            : requestType === "true" || requestType === true,
      },
    })

    res.status(201).json(certificate)
    console.log("Role: staff");
    console.log("Created new certificate with ID:", certificate.id);
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    })
  }
}

/* READ ALL */
export const getCertificates = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const certificates = await prisma.certificates.findMany()

    const result = await Promise.all(
      certificates.map(async cert => ({
        ...cert,
        template_url: cert.template_path
          ? await generateSignedUrl(cert.template_path, 60 * 5)
          : null,
      }))
    )

    res.json(result)
    console.log("Role: staff");
    console.log("Fetched certificates list. Total certificates in this query:", result.length);
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    })
  }
}

export const getResidentCertificates = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const certificates = await prisma.certificates.findMany({
      where: { public_view: true },
    })

    const result = await Promise.all(
      certificates.map(async cert => ({
        id: cert.id,
        template_name: cert.template_name,
        template_requirements: cert.template_requirements,
        template_price: cert.template_price,
        requestType: cert.requestType,
        timestamp: cert.timestamp,
        
        

      }))
    )

    res.json(result)
    console.log("Fetched resident certificates:", result.length)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    })
  }
}



/* UPDATE */
export const updateCertificates = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { template_name, template_price,template_requirements, requestType, public_view } = req.body
    const file = req.file

    // 1️⃣ Find existing certificate
    const existing = await prisma.certificates.findUnique({
      where: { id },
    })

    if (!existing) {
      res.status(404).json({ error: "Certificate not found" })
      return
    }

    let template_path = existing.template_path

    // 2️⃣ If new file uploaded, replace old file
    if (file) {
      template_path = await updateSupabaseFile({
        bucket: "certificate_template",
        file,
        oldPath: existing.template_path,
      })
    }

    // 3️⃣ Update certificate in DB
    const updated = await prisma.certificates.update({
      where: { id },
      data: {
        template_name: template_name ?? existing.template_name,
        template_price: template_price
          ? Number(template_price)
          : existing.template_price,
        template_path,
        template_requirements: template_requirements ?? existing.template_requirements,
        requestType:
          requestType === undefined
            ? existing.requestType
            : requestType === "true" || requestType === true,
        public_view:
          public_view === undefined
            ? existing.public_view
            : public_view === "true" || public_view === true,
      },
    })

    res.json(updated)
    console.log("Role: staff");
    console.log("Updated certificate with ID:", updated.id);
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    })
  }
}

/* DELETE */
export const deleteCertificates = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1️⃣ Find the certificate to get template_path
    const existing = await prisma.certificates.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      res.status(404).json({ error: "Certificate not found" })
      return
    }

    // 2️⃣ Delete file from Supabase if exists
    if (existing.template_path) {
      await deleteFromSupabase({
        bucket: "certificate_template",
        path: existing.template_path,
      })
    }

    // 3️⃣ Delete record from DB
    await prisma.certificates.delete({
      where: { id: req.params.id },
    })

    console.log("Role: staff");
    console.log("Certificate deleted with ID:", req.params.id);
    res.json({ message: "Certificate deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    })
  }
}
