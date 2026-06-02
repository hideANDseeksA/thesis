import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import axios from "axios"

/**
 * Extracts placeholder fields from a DOCX file stored at a URL.
 * Supports [[field_name]] placeholders.
 */
export async function extractDocxFields(docxUrl: string): Promise<string[]> {
  try {
    const response = await axios.get(docxUrl, { responseType: "arraybuffer" })

    const zip = new PizZip(response.data)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "[[", end: "]]" },
    })

    const text = doc.getFullText()

    const matches = text.match(/\[\[(.*?)\]\]/g) || []

    return [
      ...new Set(
        matches
          .map(m => m.replace(/\[|\]/g, "").trim())
          .filter(field => field !== "issued") // 🚫 exclude [[issued]]
      ),
    ]
  } catch (err: any) {
    console.error("DOCX TEMPLATE ERROR:", err)
    return []
  }
}
