// src/utils/certificates/helper.generateCertificate.ts
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import axios from "axios"


export async function generateCertificate(
  templateUrl: string,
  data: Record<string, string>
): Promise<Buffer> {
  // 1️⃣ Fetch template
  const response = await axios.get(templateUrl, {
    responseType: "arraybuffer",
  })

  // 2️⃣ Load DOCX
  const zip = new PizZip(response.data)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "[[", end: "]]" },
  })

  // 3️⃣ Render
  doc.render(data)

  // 4️⃣ Generate buffer
  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  })
}