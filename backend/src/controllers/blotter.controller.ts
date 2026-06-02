// blotter.controller.ts (EMBEDDING REMOVED / PURE PRISMA CRUD)

import { Request, Response } from "express";
import prisma from "../prisma";
import { uploadToSupabase } from "../utils/supabaseUpload.util";
import { generateSignedUrl } from "../utils/supabaseUrl.util";
import { decryptAll } from "../utils/crypto.util";
import { updateSupabaseFile } from "../utils/supabaseUpdate.util";
import { apiCache } from "../utils/apiCache";
import { titleCaseDeep } from "../helper/lowercase.helper";
import { hashString } from "../utils/hash.util";


// ─── CREATE ───────────────────────────────────────────────────────────────────

export const createBlotter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { resident_id, details, status, type_case, case_no } = req.body;
    const file = req.file;

    let file_path: string | null = null;
    let hashtypecase: string | null = null;

 
    if (type_case) {
      hashtypecase = hashString(type_case);
    }

    if (file) {
      file_path = await uploadToSupabase({
        bucket: "blotter",
        file,
      });
    }

    await prisma.blotter.create({
      data: {
        resident_id,
        details,
        status,
        type_case: hashtypecase,
        case_no,
        file_path,
      },
    });

    apiCache.clearAll();

    res.status(201).json({
      message: "Blotter created successfully",
    });
    console.log("Role: staff");
    console.log("Created new blotter record for resident ID:", resident_id);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

// ─── SEARCH (NORMAL FILTER ONLY) ──────────────────────────────────────────────
// Searches case_no, status, h_resident only
// details is encrypted so direct search is not reliable

export const searchBlotters = async (req: Request, res: Response) => {
  try {
    const { query, limit = 15 } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        message: "Query is required",
      });
    }

    const results = await prisma.blotter.findMany({
      where: {
        OR: [
          {
            case_no: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            status: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            type_case: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: Number(limit),
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedResults = await Promise.all(
      results.map(async (r) => {
        let detailsObj: Record<string, any> = {};

        try {
          detailsObj = r.details ? JSON.parse(decryptAll(r.details)) : {};
        } catch {
          detailsObj = {};
        }

        return {
          ...r,
          file_url: r.file_path
            ? await generateSignedUrl(r.file_path, 60 * 5)
            : null,
          details: titleCaseDeep(detailsObj),
        };
      })
    );

    return res.json(formattedResults);
  } catch (err) {
    console.error("Error searching blotters:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ─── READ ALL (PAGINATED) ─────────────────────────────────────────────────────

export const getbBlotter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 10)
    );

    const skip = (page - 1) * limit;

    const cacheKey = `blotters_page_${page}_limit_${limit}`;

    const blottersWithUrls = await apiCache.get(
      cacheKey,
      async () => {
        const [blotters, total] = await Promise.all([
          prisma.blotter.findMany({
            skip,
            take: limit,
            orderBy: {
              created_at: "desc",
            },
          }),
          prisma.blotter.count(),
        ]);

        const results = await Promise.all(
          blotters.map(async (blotter) => ({
            ...blotter,
            file_url: blotter.file_path
              ? await generateSignedUrl(blotter.file_path, 60 * 60 * 24)
              : null,
            details: blotter.details
              ? JSON.parse(decryptAll(blotter.details))
              : null,
          }))
        );

        return {
          data: results,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
      60 * 60
    );

    res.json(blottersWithUrls);
    console.log("Role: staff");
    console.log(`Fetched blotters list - Page: ${page}, Limit: ${limit}, Total records in this query: ${blottersWithUrls.data.length}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
};

// ─── READ ONE ─────────────────────────────────────────────────────────────────

export const getBlotterById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const blotter = await prisma.blotter.findUnique({
      where: { id },
    });

    if (!blotter) {
      res.status(404).json({
        error: "Blotter record not found",
      });
      return;
    }

    res.json({
      ...blotter,
      file_url: blotter.file_path
        ? await generateSignedUrl(blotter.file_path, 60 * 5)
        : null,
      details: blotter.details
        ? JSON.parse(decryptAll(blotter.details))
        : null,
    });

    console.log("Role: staff");
    console.log("Fetched blotter record with ID:", id);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export const updateBlotter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { details, status, resident_id, type_case, case_no } = req.body;
    const file = req.file;
    const { id } = req.params;

    const existing = await prisma.blotter.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        error: "Blotter not found",
      });
      return;
    }

    let file_path: string | undefined;
    let hashtypecase: string | undefined;

    if (type_case) {
      hashtypecase = hashString(type_case);
    }

    if (file) {
      file_path = await updateSupabaseFile({
        bucket: "blotter",
        file,
        oldPath: existing.file_path,
      });
    }

    await prisma.blotter.update({
      where: { id },
      data: {
        details: details ?? undefined,
        status: status ?? undefined,
        resident_id: resident_id ?? undefined,
        type_case: hashtypecase ?? undefined,
        case_no: case_no ?? undefined,
        file_path: file_path ?? undefined,
        updated_at: new Date(),
      },
    });

    apiCache.clearAll();

    res.json({
      message: "Blotter updated successfully",
    });
    console.log("Role: staff");
    console.log("Updated blotter record with ID:", id);
  } catch (err) {
    console.error("Update blotter error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export const updateBlotterStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      res.status(400).json({
        error: "Status is required",
      });
      return;
    }

    const existing = await prisma.blotter.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        error: "Blotter not found",
      });
      return;
    }

    await prisma.blotter.update({
      where: { id },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    apiCache.clearAll();

    res.json({
      message: "Blotter status updated successfully",
    });
    console.log("Role: staff");
    console.log(`Updated blotter status to "${status}" for record ID: ${id}`);
  } catch (err) {
    console.error("Update blotter status error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
// ─── DELETE ───────────────────────────────────────────────────────────────────

export const deleteBlotter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await prisma.blotter.delete({
      where: {
        id: req.params.id,
      },
    });

    apiCache.clearAll();

    res.json({
      message: "Blotter deleted successfully",
    });
    console.log("Role: staff");
    console.log("Deleted blotter record with ID:", req.params.id);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
};

type GroupedCase = {
  case_no: string | null;
  date: string | null;
  time: string | null;
  complaint_type: string | null;
  status: string;
  created_at: Date;
};

type GroupedEntry = {
  total: number;
  statuses: Record<string, number>;
  cases: GroupedCase[];
};

type GroupedReport = Record<string, GroupedEntry>;

// ✅ GET /blotter/report?type=monthly&month=5&year=2026
// ✅ GET /blotter/report?type=yearly&year=2026
export const getBlotterReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();
    const type = (req.query.type as string) ?? "monthly"; // "monthly" | "yearly"

    const year = req.query.year
      ? parseInt(req.query.year as string)
      : now.getFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
      res.status(400).json({ error: "Invalid year." });
      return;
    }

    let start: Date;
    let end: Date;
    let label: string;

    if (type === "yearly") {
      // ✅ Full year range
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31, 23, 59, 59, 999);
      label = `${year}`;
    } else {
      // ✅ Monthly range (default)
      const month = req.query.month 
        ? parseInt(req.query.month as string) - 1
        : now.getMonth();

      if (isNaN(month) || month < 0 || month > 11) {
        res.status(400).json({ error: "Invalid month. Use 1-12." });
        return;
      }

      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      label = start.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }

    // ✅ Single query
    const detailed = await prisma.blotter.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end,
        },
      },
      select: {
        status: true,
        created_at: true,
        details: true,
      },
      orderBy: { created_at: "asc" },
    });

    // ✅ Decrypt each record
    const decrypted = detailed.map((item) => {
      let parsed: Record<string, string> = {};
      try {
        if (item.details) {
          parsed = JSON.parse(decryptAll(item.details));
        }
      } catch {}

      return {
        complaint_type: parsed.complaint_type ?? null,
        case_no: parsed.case_no ?? null,
        date: parsed.date ?? null,
        time: parsed.time ?? null,
        status: item.status,
        created_at: item.created_at,
      };
    });

    // ✅ Group by complaint_type
    const grouped = decrypted.reduce<GroupedReport>((acc, item) => {
      const key = item.complaint_type ?? "Uncategorized";
      if (!acc[key]) {
        acc[key] = { total: 0, statuses: {}, cases: [] };
      }
      acc[key].total += 1;
      acc[key].statuses[item.status] =
        (acc[key].statuses[item.status] ?? 0) + 1;
      acc[key].cases.push({
        case_no: item.case_no,
        date: item.date,
        time: item.time,
        complaint_type: item.complaint_type,
        status: item.status,
        created_at: item.created_at,
      });
      return acc;
    }, {});

    const summary = Object.entries(grouped).map(([complaint_type, data]) => ({
      complaint_type,
      count: data.total,
    }));

    // ✅ Only included for yearly
    const by_month =
      type === "yearly"
        ? decrypted.reduce<Record<string, number>>((acc, item) => {
            const monthLabel = new Date(item.created_at).toLocaleString(
              "default",
              { month: "long" }
            );
            acc[monthLabel] = (acc[monthLabel] ?? 0) + 1;
            return acc;
          }, {})
        : undefined;

    res.status(200).json({
      type,
      label,
      total_cases: decrypted.length,
      ...(by_month && { by_month }), // only appears in yearly
      summary,
      grouped,
    });
    console.log("Role: staff");
    console.log("Blotter Generate Report")
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};