import { Request, Response } from "express"
import prisma from "../prisma"
import { generateSignedUrl } from "../utils/supabaseUrl.util"
import { extractDocxFields } from "../utils/certificates/certificate.generator"

export const getCertificateForm = async (req: Request, res: Response) => {
  const cert = await prisma.certificates.findUnique({
    where: { id: req.params.id },
  })

if (!cert?.template_path) {
  return res.status(400).json({ error: "Template not found" })
}

const signedUrl = await generateSignedUrl(cert.template_path, 60 * 5)

if (!signedUrl) {
  return res.status(400).json({ error: "Failed to generate signed URL" })
}

const fields = await extractDocxFields(signedUrl)



  res.json({
    template_id: cert.id,
    template_name:cert.template_name,
    requestType: cert.requestType,
    fields: fields.map(name => ({
      name,
      label: name.replace(/_/g, " "),
      type: "text",
      required: true,
    })),
  })
}
