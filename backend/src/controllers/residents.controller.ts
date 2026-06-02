import { Request, Response } from "express"
import prisma from "../prisma"
import { handlePrismaError } from "../helper/prisma.helper"
import { decryptAll, safeDecrypt } from "../utils/crypto.util"
import { calculateAge } from "../helper/agecalculator.helper"
import { Prisma } from "@prisma/client"
import { lowercaseDeep,normalizeFullName,titleCaseDeep,uppercaseJson } from "../helper/lowercase.helper"
import { hashEmail, hashlastName } from "../utils/hash.util"
import { apiCache } from "../utils/apiCache" // adjust path as needed

// TTL constants (seconds)
const TTL = {
  LIST: 60 * 2,    // 2 min — paginated lists change frequently
  BDAC: 60 * 5,    // 5 min
  ARCHIVE: 60 * 5, // 5 min
  SINGLE: 60 * 5,  // 5 min per resident
} as const

// Cache key builders — centralised so invalidation never typos a key
const cacheKey = {
  list: (page: number, limit: number, search: string, purokId: string) =>
    `residents:list:${page}:${limit}:${search}:${purokId}`,
  bdac: (page: number, limit: number) =>
    `residents:bdac:${page}:${limit}`,
  archive: (page: number, limit: number) =>
    `residents:archive:${page}:${limit}`,
  single: (id: string) =>
    `resident:${id}`,
}

// Invalidates every key pattern touched by a write.
// Uses cache.list() so new query combinations are caught automatically.
function invalidateResidentCaches(residentId?: string) {
  const patterns = ["residents:list", "residents:bdac", "residents:archive"]
  const keys = apiCache["cache"].keys() as string[] // access internal NodeCache keys

  for (const key of keys) {
    if (patterns.some((p) => key.startsWith(p))) {
      apiCache.clear(key)
    }
  }

  if (residentId) {
    apiCache.clear(cacheKey.single(residentId))
  }
}

/* ──────────────────────────────────────────────
   CREATE
────────────────────────────────────────────── */
type CreateResidentBody = Omit<Prisma.residentsCreateInput, 'purok'> & {
  force?: boolean
  purok_id?: string
}

export const createResident = async (
  req: Request<{}, {}, CreateResidentBody>,
  res: Response
): Promise<void> => {
  try {
    const { force, purok_id, ...rest } = req.body

    const h_email_address = req.body.email_address
      ? hashEmail(safeDecrypt(req.body.email_address.toLowerCase()))
      : null

    const h_l_name = req.body.l_name
      ? hashlastName(safeDecrypt(req.body.l_name.toLowerCase()))
      : null

    const hash_full = normalizeFullName(
      safeDecrypt(req.body.f_name),
      safeDecrypt(req.body.m_name),
      safeDecrypt(req.body.l_name),
      safeDecrypt(req.body?.s_name || "")
    ).toLowerCase()

    if (!force) {
      const existing = await prisma.residents.findFirst({
        where: {
          h_full_name: hash_full,
          b_date: req.body.b_date ? new Date(req.body.b_date).toISOString() : undefined,
        },
      })

      if (existing) {
        res.status(409).json({
          message: "A resident with the same name and birthdate already exists.",
          conflict: true,
          existingId: existing.id,
        })
        return
      }
    }

    const data = lowercaseDeep({
      ...rest,
      b_date: req.body.b_date ? new Date(req.body.b_date).toISOString() : null,
      citizenship_date: req.body.citizenship_date ? new Date(req.body.citizenship_date).toISOString() : null,
      h_email_address,
      h_l_name,
      h_full_name: hash_full,
    })

    const resident = await prisma.residents.create({
      data: {
        ...data,
        purok_id: purok_id ?? null,
      },
    })

    invalidateResidentCaches()

    res.status(201).json(resident)
    console.log("Role: staff");
    console.log("New resident created with ID:", resident.id)
  } catch (err) {
    handlePrismaError(err, res)
  }
}

/* ──────────────────────────────────────────────
   GET LIST
────────────────────────────────────────────── */
export const getResidents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.max(Number(req.query.limit) || 50, 1)
    const skip = (page - 1) * limit
    const search = String(req.query.search || "").trim()
    const purokId = String(req.query.purok_id || "").trim()

    const key = cacheKey.list(page, limit, search, purokId)

    const result = await apiCache.get(
      key,
      async () => {
        const hashedLastName = search ? hashlastName(search) : null
        const hashedEmail = search ? hashEmail(search) : null

        const baseWhere = {
          AND: [
            {
              OR: [
                { remarks: null },
                { remarks: { not: "archive" } },
              ],
            },
          ],
        }

        const listWhereCondition: any = {
          AND: [
            ...baseWhere.AND,
            ...(purokId ? [{ purok_id: purokId }] : []),
            ...(search
              ? [
                  {
                    OR: [
                      { resident_id: { contains: search, mode: "insensitive" } },
                      { h_l_name: { equals: hashedLastName } },
                      { h_email_address: { equals: hashedEmail } },
                    ],
                  },
                ]
              : []),
          ],
        }

     const summaryWhereCondition: any = {
  AND: [
    {
      OR: [
        { remarks: null },
        { remarks: { not: "archive" } },
      ],
    },
    ...(purokId ? [{ purok_id: purokId }] : []),
  ],
}

        const [residents, total, employmentCounts, votingCounts, purokGroups] =
          await Promise.all([
            prisma.residents.findMany({
              where: listWhereCondition,
              skip,
              take: limit,
              include: { purok: { select: { name: true } } },
              orderBy: { times_tamp: "desc" },
            }),
            prisma.residents.count({ where: listWhereCondition }),
            prisma.residents.groupBy({
              by: ["emp_status"],
              where: summaryWhereCondition,
              _count: { emp_status: true },
            }),
            prisma.residents.groupBy({
              by: ["voting_status"],
              where: summaryWhereCondition,
              _count: { voting_status: true },
            }),
            prisma.residents.groupBy({
              by: ["purok_id"],
              where: summaryWhereCondition,
              _count: { purok_id: true },
            }),
          ])

        const purokIds = purokGroups
          .map((item) => item.purok_id)
          .filter((id): id is string => Boolean(id))

        const puroks = purokIds.length
          ? await prisma.purok.findMany({
              where: { id: { in: purokIds } },
              select: { id: true, name: true },
            })
          : []

        const purokMap = new Map(puroks.map((p) => [p.id, p.name]))

        const purokCountSummary = purokGroups.reduce(
          (acc: Record<string, number>, curr) => {
            const purokName = curr.purok_id
              ? purokMap.get(curr.purok_id) || "Unknown"
              : "Unknown"
            acc[purokName] = curr._count.purok_id ?? 0
            return acc
          },
          {}
        )

        const decryptedResidents = decryptAll(residents)
        const residentsWithAge = decryptedResidents.map((resident: any) => ({
          ...resident,
          age: calculateAge(resident.b_date),
        }))

        const empStatusSummary = employmentCounts.reduce(
          (acc: Record<string, number>, curr) => {
            acc[curr.emp_status || "unknown"] = curr._count.emp_status
            return acc
          },
          {}
        )

        const votingStatusSummary = votingCounts.reduce(
          (acc: Record<string, number>, curr) => {
            acc[curr.voting_status || "unknown"] = curr._count.voting_status
            return acc
          },
          {}
        )

        return {
          residents: residentsWithAge,
          meta: {
            page,
            limit,
            total,
            search,
            purok_id: purokId || null,
            registeredCount: votingStatusSummary,
            employmentSummary: empStatusSummary,
            purokCounts: purokCountSummary,
            totalPages: Math.ceil(total / limit),
          },
        }
      },
      TTL.LIST
    )

    res.json(result)
    console.log("Role: staff");
    console.log("Fetched residents list with pagination. Total residents in this query:", result.meta.total);
  } catch (err) {
    handlePrismaError(err, res)
  }
}

/* ──────────────────────────────────────────────
   GET BDAC
────────────────────────────────────────────── */
export const getBDACResidents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.max(Number(req.query.limit) || 50, 1)
    const skip = (page - 1) * limit

    const key = cacheKey.bdac(page, limit)

    const result = await apiCache.get(
      key,
      async () => {
        const [residents, total, registeredCount] = await Promise.all([
          prisma.residents.findMany({
            where: { remarks: "bdac" },
            skip,
            take: limit,
            include: { purok: { select: { name: true } } },
          }),
          prisma.residents.count({ where: { remarks: "bdac" } }),
          prisma.residents.count({
            where: { remarks: "bdac", voting_status: "registered" },
          }),
        ])

        const decryptedResidents = decryptAll(residents)
        const residentsWithAge = decryptedResidents.map((resident: any) => ({
          ...resident,
          age: resident.b_date ? calculateAge(resident.b_date) : null,
        }))

        return {
          residents: residentsWithAge,
          meta: {
            page,
            limit,
            total,
            registeredCount,
            totalPages: Math.ceil(total / limit),
          },
        }
      },
      TTL.BDAC
    )

    res.json(result)
    console.log("Role: staff");
    console.log("Fetched BDAC residents list with pagination. Total BDAC residents in this query:", result.meta.total);
  } catch (err) {
    handlePrismaError(err, res)
  }
}

/* ──────────────────────────────────────────────
   GET ARCHIVE
────────────────────────────────────────────── */
export const getArchiveResidents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.max(Number(req.query.limit) || 50, 1)
    const skip = (page - 1) * limit

    const key = cacheKey.archive(page, limit)

    const result = await apiCache.get(
      key,
      async () => {
        const [residents, total] = await Promise.all([
          prisma.residents.findMany({
            where: { remarks: "archive" },
            skip,
            take: limit,
            include: { purok: { select: { name: true } } },
          }),
          prisma.residents.count({ where: { remarks: "archive" } }),
        ])

        const decryptedResidents = decryptAll(residents)
        const residentsWithAge = decryptedResidents.map((resident: any) => ({
          ...resident,
          age: calculateAge(resident.b_date),
        }))

        return {
          residents: residentsWithAge,
          meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        }
      },
      TTL.ARCHIVE
    )

    console.log("Role: staff");
    console.log("Fetched archive residents list with pagination. Total archive residents in this query:", result.meta.total);
    res.json(result)
  } catch (err) {
    handlePrismaError(err, res)
  }
}

/* ──────────────────────────────────────────────
   GET BY ID
────────────────────────────────────────────── */
export const getResidentsByID = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Resident ID is required" })
    }

    const key = cacheKey.single(id)

    const resident = await apiCache.get(
      key,
      async () => {
        const found = await prisma.residents.findUnique({
          where: { resident_id: String(id) },
          include: { purok: { select: { name: true } } },
        })

        if (!found) return null
        return found
      },
      TTL.SINGLE
    )

    if (!resident) {
      return res.status(404).json({ error: "Resident not found" })
    }

    console.log("Role: staff");
    console.log("Fetched resident with ID:", resident.resident_id);
    res.json(resident)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch resident" })
  }
}

/* ──────────────────────────────────────────────
   UPDATE
────────────────────────────────────────────── */
export const updateResident = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const h_email_address = req.body.email_address
      ? hashEmail(safeDecrypt(req.body.email_address.toLowerCase()))
      : null

    const h_l_name = req.body.l_name
      ? hashlastName(safeDecrypt(req.body.l_name.toLowerCase()))
      : null

    const hash_full = normalizeFullName(
      safeDecrypt(req.body.f_name),
      safeDecrypt(req.body.m_name),
      safeDecrypt(req.body.l_name),
      safeDecrypt(req.body?.s_name || "")
    ).toLowerCase()

    const data = lowercaseDeep({
      ...req.body,
      b_date: req.body.b_date ? new Date(req.body.b_date).toISOString() : null,
      citizenship_date: req.body.citizenship_date ? new Date(req.body.citizenship_date).toISOString() : null,
      h_email_address,
      h_l_name,
      h_full_name: hash_full,
    })

    const resident = await prisma.residents.update({
      where: { id: req.params.id },
      data,
    })

    console.log("Role: staff");
    console.log("Resident updated with ID:", resident.resident_id);
    invalidateResidentCaches(resident.resident_id)

    res.json(resident)
  } catch (err) {
    console.error(err)
    handlePrismaError(err, res)
  }
}

/* ──────────────────────────────────────────────
   UPDATE REMARKS
────────────────────────────────────────────── */
export const updateResidentRemarks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { remarks } = req.body

    const resident = await prisma.residents.update({
      where: { id: req.params.id },
      data: { remarks },
    })

    console.log("Role: staff");
    console.log("Resident remarks updated with ID:", resident.resident_id);

    // Remarks changes affect which list a resident appears in —
    // bust all list caches plus the individual record.
    invalidateResidentCaches(resident.resident_id)

    res.json({
      success: true,
      message: "Resident remarks updated successfully.",
      data: resident,
    })
  } catch (err) {
    handlePrismaError(err, res)
  }
}

/* ──────────────────────────────────────────────
   DELETE
────────────────────────────────────────────── */
export const deleteResident = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const resident = await prisma.residents.delete({
      where: { id: req.params.id },
    })

    invalidateResidentCaches(resident.resident_id)

    res.json({ message: "Resident deleted successfully" })
    console.log("Role: staff");
    console.log("Resident deleted with ID:", resident.resident_id);
  } catch (err) {
    console.log(err)
    handlePrismaError(err, res)
  }
}


const BATCH_SIZE = 500;

const escapeCSV = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCSVRow = (fields: unknown[]): string =>
  fields.map(escapeCSV).join(",") + "\r\n";

type ResidentWithPurok = Prisma.residentsGetPayload<{
  include: { purok: { select: { name: true } } };
}>;

type AgeGroup = "all" | "1-19" | "20-59" | "60+";

const getAgeFilter = (ageGroup: AgeGroup): { gte?: Date; lte?: Date } | null => {
  const now = new Date();
  const yearsAgo = (y: number) => new Date(new Date().setFullYear(now.getFullYear() - y));

  switch (ageGroup) {
    case "1-19":  return { gte: yearsAgo(19), lte: yearsAgo(1) };
    case "20-59": return { gte: yearsAgo(59), lte: yearsAgo(20) };
    case "60+":   return { lte: yearsAgo(60) };
    default:      return null;
  }
};

export const exportResidentsCSV = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ageGroup = (req.query.age_group as AgeGroup) ?? "all";
    const validAgeGroups: AgeGroup[] = ["all", "1-19", "20-59", "60+"];

    if (!validAgeGroups.includes(ageGroup)) {
      res.status(400).json({
        message: `Invalid age_group. Valid options: ${validAgeGroups.join(", ")}`,
      });
      return;
    }

    const ageFilter = getAgeFilter(ageGroup);

    const headers = [
      "Purok",
      "House No",
      "Resident ID",
      "First Name",
      "Middle Name",
      "Last Name",
      "Suffix",
      "Sex",
      "Age",
      "Birth Date",
      "Birth Place",
      "Civil Status",
      "Employment Status",
      "Education",
      "Occupation",
      "Contact No",
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="residents_${ageGroup}_${Date.now()}.csv"`
    );

    res.write(toCSVRow(headers));

    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const batch: ResidentWithPurok[] = await prisma.residents.findMany({
        take: BATCH_SIZE,
        ...(cursor && {
          skip: 1,
          cursor: { id: cursor },
        }),
        where: {
          AND: [
            {
              OR: [
                { remarks: null },
                { remarks: { not: "archive" } },
              ],
            },
            ...(ageFilter ? [{ b_date: ageFilter }] : []),
          ],
        },
        include: {
          purok: { select: { name: true } },
        },
        orderBy: [
          { purok: { name: "asc" } },
          { house_no: "asc" },
          { id: "asc" },
        ],
      });

      if (batch.length === 0) break;

      const decrypted = titleCaseDeep(decryptAll(batch)) as ResidentWithPurok[];

// Sort by: purok → house_no → last name
const sorted = decrypted.sort((a, b) => {
  // 1. Purok
  const purokA = a.purok?.name ?? "Unassigned";
  const purokB = b.purok?.name ?? "Unassigned";
  const purokCmp = purokA.localeCompare(purokB);
  if (purokCmp !== 0) return purokCmp;

  // 2. House No
  const houseA = a.house_no ?? "";
  const houseB = b.house_no ?? "";
  const houseCmp = houseA.localeCompare(houseB, undefined, { numeric: true });
  if (houseCmp !== 0) return houseCmp;

  // 3. Last Name (decrypted)
  return (a.l_name ?? "").localeCompare(b.l_name ?? "");
});

for (const r of sorted) {
  const age = r.b_date ? calculateAge(r.b_date) : "";

  res.write(
    toCSVRow([
      r.purok?.name ?? "Unassigned",
      r.house_no ?? "",
      r.resident_id,
      r.f_name,
      r.m_name ?? "",
      r.l_name,
      r.s_name ?? "",
      r.sex,
      age,
      r.b_date ? new Date(r.b_date).toISOString().split("T")[0] : "",
      r.b_place ?? "",
      r.civil_status ?? "",
      r.emp_status ?? "",
      r.education ?? "",
      r.occupation ?? "",
      r.contact_no ?? "",
    ])
  );

      }

      if (batch.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        cursor = batch[batch.length - 1].id;
      }
    }

    res.end();
    console.log("Role: staff");
    console.log(`Exported residents CSV for age group "${ageGroup}".`);
  } catch (err) {
    if (!res.headersSent) {
      handlePrismaError(err, res);
    } else {
      console.error("CSV stream error after headers sent:", err);
      res.end();
    }
  }
};