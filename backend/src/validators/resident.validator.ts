import { z } from "zod"

const nameField = (label: string, max = 50, required = false) => {
  let schema = z
    .string()
    .trim()
    .max(max, `${label} must not exceed ${max} characters`)
    .regex(
      /^[A-Za-zÑñ\s'-]+$/,
      `${label} must only contain letters, spaces, apostrophes, or hyphens`
    )

  if (required) {
    return schema.min(1, `${label} is required`)
  }

  return z.union([schema, z.null(), z.undefined(), z.literal("")])
}

const optionalText = (label: string, max = 100) =>
  z.union([
    z.string().trim().max(max, `${label} must not exceed ${max} characters`),
    z.null(),
    z.undefined(),
    z.literal(""),
  ])

export const residentSchema = z.object({
  resident_id: z.string().optional(),

  f_name: nameField("First name", 50, true),
  m_name: nameField("Middle name", 50),
  md_name: nameField("Middle initial", 10),
  l_name: nameField("Last name", 50, true),
  s_name: nameField("Suffix", 20),

  house_no: optionalText("House number", 20),
  b_place: optionalText("Birth place", 100),
  voting_status: optionalText("Voting status", 30),
  sector: optionalText("Sector", 50),
  remarks: optionalText("Remarks", 255),
  occupation: optionalText("Occupation", 100),  // ✅ Added

  email_address: z.union([
    z.string().trim().email("Invalid email address"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  contact_no: z.union([
    z
      .string()
      .trim()
      .regex(/^(09\d{9}|\+639\d{9})$/, "Invalid contact number"),
    z.literal(""),
    z.undefined(),
    z.null(),
  ]),

  b_date: z.coerce.date().optional().nullable(),

  sex: z.enum(["male", "female"]).optional(),

  blood_type: optionalText("Blood type", 5),

  civil_status: z
    .enum([
      "single",
      "married",
      "widow",
      "seperated",
      "annulled",
      "co_habitation",
    ])
    .optional(),

  education: z
    .enum([
      "none",
      "elementary",
      "highschool",
      "vocational",
      "college",
      "postgraduate",
    ])
    .optional(),

  emp_status: z
    .enum([
      "student",
      "employed",
      "retired",
      "unemployed",
      "unknown",
    ])
    .optional(),

  citizenship: z                          // ✅ Added
    .enum(["filipino", "foreign", "dual"])
    .optional()
    .nullable(),

  purok_id: z.union([
    z.string().uuid("Invalid purok_id"),
    z.literal(""),
    z.null(),
    z.undefined(),
  ]),

  purok: optionalText("Purok", 50),
})

export const residentUpdateSchema = residentSchema.partial()

export type ResidentInput = z.infer<typeof residentSchema>
export type ResidentUpdateInput = z.infer<typeof residentUpdateSchema>