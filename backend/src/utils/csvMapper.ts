import { Prisma } from "@prisma/client"
import { encrypt } from "./crypto.util"

export const csvToResidentBulkMapper = (
  row: any,
  purokMap: Record<string, string>
): Prisma.residentsCreateManyInput => {
  // Normalize keys
  const normalizedRow: Record<string, string> = {}
  Object.keys(row).forEach((key) => {
    normalizedRow[key.trim()] = row[key]?.toString().trim() || ""
  })

  const purokName = normalizedRow["Purok"] || ""
  const purokId = purokMap[purokName]

  // Lowercase before encrypting (except contact_no)
  const maybeEncrypt = (value?: string | null, keepCase = false) => {
    if (!value) return null
    const v = keepCase ? value : value.toLowerCase()
    return encrypt(v)
  }

  // Safe birth date parser
  const parseDate = (value?: string) => {
    if (!value) return null
    const [month, day, year] = value.split("/")
    if (!month || !day || !year) return null
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  return {
    f_name: maybeEncrypt(normalizedRow["First Name"]) || "unknown",
    l_name: maybeEncrypt(normalizedRow["Last Name"]) || "unknown",
    sex:
      normalizedRow["Sex"]?.toLowerCase() === "female"
        ? "female"
        : "male",
    m_name: maybeEncrypt(normalizedRow["Middle Name"]) || null,
    s_name: maybeEncrypt(normalizedRow["Suffix"]) || null,
    b_date: parseDate(normalizedRow["Birth Date"]),
    b_place: maybeEncrypt(normalizedRow["Birth Place"]) || null,
    email_address: maybeEncrypt(normalizedRow["Email"]) || null,
    contact_no: maybeEncrypt(normalizedRow["Contact No"], true) || null, // keep original case
    sector: normalizedRow["Sector"]?.toLowerCase() || null,
    remarks: normalizedRow["Remarks"]?.toLowerCase() || null,
    voting_status: normalizedRow["Voting Status"]?.toLowerCase() || null,
    purok_id: purokId ?? null, // FK stays as-is
  }
}
