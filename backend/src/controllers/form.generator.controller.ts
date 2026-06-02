import { Request, Response } from "express"
import prisma from "../prisma"
import { generateSignedUrl } from "../utils/supabaseUrl.util"
import { generateCertificate } from "../utils/certificates/helper.generateCertificate"
import { decrypt,decryptAll} from "../utils/crypto.util"
import { getDayWithSuffix } from "../helper/date.helper"


export const generateTransactionCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        certificate: {
          select: { template_path: true },
        },
      },
    })

    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" })
      return
    }
    `x`
    if (!transaction.details) {
      res.status(400).json({ error: "Certificate data missing" })
      return
    }

    if (!transaction.certificate?.template_path) {
      res.status(400).json({ error: "Template not configured" })
      return
    }

    // 🔓 Decrypt + parse JSON
    let certificateData: Record<string, string>
    try {
      const decrypted = decrypt(transaction.details)
      certificateData = JSON.parse(decrypted)
      const now = new Date()
      const dayth = getDayWithSuffix(now.getDate())
      const month = now.toLocaleString("en-US", { month: "long" })
      const year = now.getFullYear()

      certificateData.issued = `${dayth} day of ${month} ${year}`
    } catch {
      res.status(400).json({ error: "Invalid certificate details format" })
      return
    }

    const templateUrl = await generateSignedUrl(
      transaction.certificate.template_path,
      60 * 5
    )

    if (!templateUrl) {
      res.status(500).json({ error: "Failed to generate template URL" })
      return
    }

    // 🧾 Generate DOCX buffer (NO FILE SYSTEM)
    const buffer = await generateCertificate(templateUrl, certificateData)

    // 📥 Force download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${transaction.id}.docx"`
    )
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    res.send(buffer)

    console.log("Role: staff");
    console.log("Generated certificate for transaction ID:", transaction.id);

    // ✅ Update status (async)
    prisma.transaction.update({
      where: { id },
      data: { status: "completed" },
    }).catch(console.error)

  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Certificate generation failed",
    })
  }
}


export const createAndGenerateCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { certificate_id, resident_id, details } = req.body

    if (!certificate_id || !resident_id || !details) {
      res.status(400).json({ error: "certificate_id, resident_id, and details are required" })
      return
    }

    // 1️⃣ Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        certificate_id,
        resident_id,
        details: JSON.stringify(details), // encrypt later if needed
        status: "pending",
      },
      include: {
        certificate: { select: { template_path: true } },
      },
    })

    if (!transaction.certificate?.template_path) {
      res.status(400).json({ error: "Template not configured for this certificate" })
      return
    }

    // 2️⃣ Prepare certificate data
    let certificateData: Record<string, any> = details

    const now = new Date()
    const dayth = getDayWithSuffix(now.getDate())
    const month = now.toLocaleString("en-US", { month: "long" })
    const year = now.getFullYear()

    certificateData.issued = `${dayth} day of ${month} ${year}`

    // 3️⃣ Generate template URL
    const templateUrl = await generateSignedUrl(transaction.certificate.template_path, 60 * 5)

    if (!templateUrl) {
      res.status(500).json({ error: "Failed to generate template URL" })
      return
    }

    // 4️⃣ Generate DOCX buffer
    const buffer = await generateCertificate(templateUrl, certificateData)

    // 5️⃣ Update transaction status to completed
    prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "completed" },
    }).catch(console.error)

    // 6️⃣ Send buffer for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${transaction.id}.docx"`
    )
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    res.send(buffer)

    console.log("Role: staff");
    console.log("Created transaction with ID:", transaction.id, "and generated certificate immediately");
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create transaction and generate certificate",
    })
  }
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th"

  switch (day % 10) {
    case 1: return "ˢᵗ"
    case 2: return "ⁿᵈ"
    case 3: return "ʳᵈ"
    default: return "ᵗʰ"
  }
}

export const updateAndGenerateCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { details, certificate_id, resident_id } = req.body

    if (!id) {
      res.status(400).json({ error: "Transaction id is required" })
      return
    }

    // 1️⃣ Update transaction to "processing"
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        certificate_id,
        resident_id,
        details,
        status: "on processing", // Update status to completed immediately
      },
      include: {
        certificate: { select: { template_path: true } },
      },
    })

    if (!transaction.certificate?.template_path) {
      throw new Error("Template not configured for this certificate")
    }

    // 2️⃣ Prepare certificate data
    const decryptedString = decrypt(transaction.details)

    if (!decryptedString) {
    throw new Error("Failed to decrypt certificate details")
    }

    const certificateData: Record<string, any> = JSON.parse(decryptedString)
   const now = new Date()

const day = now.getDate()
const suffix = getOrdinalSuffix(day)
const month = now.toLocaleString("en-US", { month: "long" })
const year = now.getFullYear()

certificateData.day = day
certificateData.suffix = suffix
certificateData.month = month
certificateData.year = year

    certificateData.issued = `${day}${suffix} day of ${month} ${year}`

    // 3️⃣ Generate signed template URL
    const templateUrl = await generateSignedUrl(
      transaction.certificate.template_path,
      60 * 5
    )

    if (!templateUrl) {
      throw new Error("Failed to generate template URL")
    }

    // 4️⃣ Generate DOCX
    const buffer = await generateCertificate(templateUrl, certificateData)


    // 6️⃣ Send file
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${transaction.id}.docx"`
    )
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    res.send(buffer)

  } catch (err) {
    console.error(err)
    console.log("Role: staff");
      console.log("Failed to update transaction and generate certificate. Error:", err instanceof Error ? err.message : err);
    // Optional: mark as failed
    if (req.params.id) {
      await prisma.transaction.update({
        where: { id: req.params.id },
        data: { status: "failed" },
      }).catch(() => {})
    }

    res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : "Failed to update transaction and generate certificate",
    })
  }
}



export const generateBlotterDocument = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    const blotter = await prisma.blotter.findUnique({
      where: { id },
    })

    if (!blotter) {
      res.status(404).json({ error: "Blotter not found" })
      return
    }

    if (!blotter.details) {
      res.status(400).json({ error: "Blotter data missing" })
      return
    }

    let blotterData: Record<string, string>
    try {
      blotterData = JSON.parse(decryptAll(blotter.details))
    } catch {
      res.status(400).json({ error: "Invalid blotter details format" })
      return
    }

    // ✅ Convert 24h time to 12h AM/PM format
    if (blotterData.time) {
      const [hours, minutes] = blotterData.time.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      blotterData.time = `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
    }

    const templateUrl = await generateSignedUrl(
      "blotter/blotter.docx",
      60 * 5
    )

    if (!templateUrl) {
      res.status(500).json({ error: "Failed to generate template URL" })
      return
    }

    const buffer = await generateCertificate(templateUrl, blotterData)

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="blotter-${blotter.case_no ?? id}.docx"`
    )
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    res.send(buffer)
    console.log("Role: staff");
    console.log("Generated blotter document for blotter ID:", id);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Blotter generation failed",
    })
  }
}