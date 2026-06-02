import { Request, Response } from "express";
import { getClient } from "@umami/api-client";
import prisma from "../prisma"
import { handlePrismaError } from "../helper/prisma.helper"
import { safeDecrypt } from "../utils/crypto.util"
import { apiCache } from "../utils/apiCache"
const WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;

const client = getClient();

// ─── Helper ───────────────────────────────────────────────────────────────────

function getDefaultDateRange() {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return { startAt: thirtyDaysAgo, endAt: now };
}

function requireWebsiteId(res: Response): string | null {
  if (!WEBSITE_ID) {
    res.status(400).json({ error: "UMAMI_WEBSITE_ID is not set" });
    return null;
  }
  return WEBSITE_ID;
}

// ─── Me ───────────────────────────────────────────────────────────────────────

/**
 * GET /me
 * Returns the currently authenticated user's profile.
 */
export const getMe = async (_req: Request, res: Response) => {
  try {
    const { ok, data, status, error } = await client.getMe();
    if (!ok) return res.status(status).json({ error });
    return res.json(data);
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

/**
 * GET /me/websites
 * Returns all websites owned by the authenticated user.
 */
export const getMyWebsites = async (_req: Request, res: Response) => {
  try {
    const { ok, data, status, error } = await client.getMyWebsites();
    if (!ok) return res.status(status).json({ error });
    return res.json(data);
  } catch (err) {
    console.error("getMyWebsites error:", err);
    return res.status(500).json({ error: "Failed to fetch user websites" });
  }
};

// ─── Websites ─────────────────────────────────────────────────────────────────

/**
 * GET /websites
 * Returns all websites the authenticated user has access to.
 */
export const getWebsites = async (_req: Request, res: Response) => {
  try {
    const { ok, data, status, error } = await client.getWebsites();
    if (!ok) return res.status(status).json({ error });
    return res.json(data);
  } catch (err) {
    console.error("getWebsites error:", err);
    return res.status(500).json({ error: "Failed to fetch websites" });
  }
};

/**
 * GET /website
 * Returns details of the website defined in UMAMI_WEBSITE_ID.
 */
export const getWebsite = async (_req: Request, res: Response) => {
  try {
    const id = requireWebsiteId(res);
    if (!id) return;

    const { ok, data, status, error } = await client.getWebsite(id);
    if (!ok) return res.status(status).json({ error });
    return res.json(data);
  } catch (err) {
    console.error("getWebsite error:", err);
    return res.status(500).json({ error: "Failed to fetch website" });
  }
};

/**
 * GET /website/active
 * Returns the number of active visitors on the website right now.
 */
export const getWebsiteActive = async (_req: Request, res: Response) => {
  try {
    const id = requireWebsiteId(res);
    if (!id) return;

    const { ok, data, status, error } = await client.getWebsiteActive(id);
    if (!ok) return res.status(status).json({ error });
    return res.json(data);
  } catch (err) {
    console.error("getWebsiteActive error:", err);
    return res.status(500).json({ error: "Failed to fetch active visitors" });
  }
};

/**
 * GET /website/stats
 * Returns aggregated stats (pageviews, visitors, visits, bounces, totalTime)
 * for a given date range.
 *
 * Query params: startAt, endAt (Unix ms timestamps), url, referrer, title,
 *               query, event, os, browser, device, country, region, city
 */
export const getWebsiteStats = async (req: Request, res: Response) => {
  try {
    const id = requireWebsiteId(res);
    if (!id) return;

    const { startAt, endAt, ...filters } =
      req.query as Record<string, string>;

    const defaults = getDefaultDateRange();

    const parsedStartAt = startAt
      ? Number(startAt)
      : defaults.startAt;

    const parsedEndAt = endAt
      ? Number(endAt)
      : defaults.endAt;

    // Create unique cache key
    const cacheKey = `website_stats:${id}:${parsedStartAt}:${parsedEndAt}:${JSON.stringify(
      filters
    )}`;

    const data = await apiCache.get(
      cacheKey,
      async () => {
        const response = await client.getWebsiteStats(id, {
          startAt: parsedStartAt,
          endAt: parsedEndAt,
          ...filters,
        });

        if (!response.ok) {
          throw {
            status: response.status,
            error: response.error,
          };
        }

        return response.data;
      },
      60 // cache for 60 seconds
    );

    return res.json(data);
  } catch (err: any) {
    console.error("getWebsiteStats error:", err);

    if (err.status) {
      return res.status(err.status).json({
        error: err.error,
      });
    }

    return res.status(500).json({
      error: "Failed to fetch website stats",
    });
  }
};


// ─── Age Brackets ─────────────────────────────────────────────────────────────
const AGE_BRACKETS = [
  { label: "0–12 (Children)",     min: 0,   max: 12  },
  { label: "13–17 (Teens)",       min: 13,  max: 17  },
  { label: "18–35 (Young Adult)", min: 18,  max: 35  },
  { label: "36–59 (Adult)",       min: 36,  max: 59  },
  { label: "60+ (Senior)",        min: 60,  max: 999 },
]

function getAge(bDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - bDate.getFullYear()
  const m = today.getMonth() - bDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--
  return age
}

// ─── Safely decrypt a nullable encrypted string, returns lowercase ─────────────
function dec(value: string | null | undefined): string {
  if (!value) return ""
  return safeDecrypt(value).toLowerCase().trim()
}

// ─── Decrypt an encrypted date string into a Date object ─────────────────────
function decDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const raw = safeDecrypt(value as string)
  if (!raw) return null
  const parsed = new Date(raw)
  return isNaN(parsed.getTime()) ? null : parsed
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date()
    const in30Days = new Date(today)
    in30Days.setDate(in30Days.getDate() + 30)

    // ── 1. Residents — fetch ALL, decrypt, then filter out archived ───────────
    // voting_status is encrypted at rest → must decrypt in memory
    const rawResidents = await prisma.residents.findMany({
      select: {
        remarks:       true,
        b_date:        true,
        sex:           true,
        occupation:    true,
        sector:        true,
        voting_status: true,   // ✅ dedicated field from residents model
      },
    })

    const residents = rawResidents
      .map((r) => ({
        remarks:       dec(r.remarks),
        b_date:        decDate(r.b_date),
        sex:           dec(r.sex as unknown as string),
        occupation:    dec(r.occupation),
        sector:        dec(r.sector),
        voting_status: dec(r.voting_status),  // ✅ decrypted
      }))
      .filter((r) => r.remarks !== "archive")

    const totalResidents = residents.length

    // ── 2. Age distribution ───────────────────────────────────────────────────
    const ageDistribution = AGE_BRACKETS.map((bracket) => {
      const count = residents.filter((r) => {
        if (!r.b_date) return false
        const age = getAge(r.b_date)
        return age >= bracket.min && age <= bracket.max
      }).length
      return { label: bracket.label, count }
    })

    const noDateCount = residents.filter((r) => !r.b_date).length
    if (noDateCount > 0) {
      ageDistribution.push({ label: "Unknown", count: noDateCount })
    }

    // ── 3. Gender distribution ────────────────────────────────────────────────
    const genderDistribution = {
      male:   residents.filter((r) => r.sex === "male").length,
      female: residents.filter((r) => r.sex === "female").length,
    }

    // ── 4. Farmers (occupation contains "farmer") ─────────────────────────────
    const farmerCount = residents.filter((r) =>
      r.occupation.includes("farmer")
    ).length

    // ── 5. Sectors ────────────────────────────────────────────────────────────
    const TRACKED_SECTORS = ["solo parent", "senior citizen"]
    const sectorCounts: Record<string, number> = {}

    for (const sector of TRACKED_SECTORS) {
      sectorCounts[sector] = residents.filter((r) =>
        r.sector.includes(sector)
      ).length
    }

    // Tally any other sectors present in the data
    residents.forEach((r) => {
      if (!r.sector) return
      const s = r.sector.trim()
      if (!TRACKED_SECTORS.includes(s)) {
        sectorCounts[s] = (sectorCounts[s] ?? 0) + 1
      }
    })

    // ── 6. Voting status — from dedicated `voting_status` field ──────────────
    // Expected decrypted values: "registered" | "non-registered" | "" | null
    const votingStatusDistribution = {
      registered:     residents.filter((r) => r.voting_status === "registered").length,
      non_registered: residents.filter((r) => r.voting_status === "non-registered").length,
      unknown:        residents.filter((r) => !r.voting_status).length,
    }

    const registeredVotersCount = votingStatusDistribution.registered

    // ── 7. Blotter cases ──────────────────────────────────────────────────────
    const [
      totalBlotter,
      pendingBlotter,
      resolvedBlotter,
      ongoingBlotter,
      rawRecentBlotters,
    ] = await Promise.all([
      prisma.blotter.count(),
      prisma.blotter.count({ where: { status: "pending" } }),
      prisma.blotter.count({ where: { status: "resolved" } }),
      prisma.blotter.count({ where: { status: "ongoing" } }),
      prisma.blotter.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          case_no:    true,
          type_case:  true,
          status:     true,
          created_at: true,
          resident: {
            select: { f_name: true, l_name: true },
          },
        },
      }),
    ])

    const recentBlotters = rawRecentBlotters.map((b) => ({
      case_no:    b.case_no,
      type_case:  safeDecrypt(b.type_case ?? ""),  // ✅ decrypted
      status:     b.status,
      created_at: b.created_at,
      resident: {
        f_name: safeDecrypt(b.resident.f_name),
        l_name: safeDecrypt(b.resident.l_name),
      },
    }))

    // ── 8. Complaints ─────────────────────────────────────────────────────────
    const [
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      ongoingComplaints,
      dismissedComplaints,
      rawRecentComplaints,
      allComplaintTypes,
    ] = await Promise.all([
      prisma.complaints.count(),
      prisma.complaints.count({ where: { status: "pending" } }),
      prisma.complaints.count({ where: { status: "resolved" } }),
      prisma.complaints.count({ where: { status: "ongoing" } }),
      prisma.complaints.count({ where: { status: "dismissed" } }),
      prisma.complaints.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id:             true,
          complaint_type: true,
          status:         true,
          created_at:     true,
          resident: {
            select: { f_name: true, l_name: true },
          },
        },
      }),
      prisma.complaints.findMany({
        select: { complaint_type: true },
      }),
    ])

    // Decrypt and group complaint types in memory
    const complaintTypeMap: Record<string, number> = {}
    for (const c of allComplaintTypes) {
      const type = safeDecrypt(c.complaint_type).trim() || "Unknown"
      complaintTypeMap[type] = (complaintTypeMap[type] ?? 0) + 1
    }

    const topComplaintTypes = Object.entries(complaintTypeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([complaint_type, count]) => ({ complaint_type, count }))

    const recentComplaints = rawRecentComplaints.map((c) => ({
      id:             c.id,
      complaint_type: safeDecrypt(c.complaint_type),
      status:         c.status,
      created_at:     c.created_at,
      resident: {
        f_name: safeDecrypt(c.resident.f_name),
        l_name: safeDecrypt(c.resident.l_name),
      },
    }))

    // ── 9. Pregnancy monitoring ───────────────────────────────────────────────
    const [
      totalPregnancies,
      ongoingPregnancies,
      deliveredPregnancies,
      trimesterGroups,
      dueSoonCount,
      overdueCount,
      rawRecentPregnancies,
    ] = await Promise.all([
      prisma.pregnancy_monitoring.count(),
      prisma.pregnancy_monitoring.count({ where: { status: "ongoing" } }),
      prisma.pregnancy_monitoring.count({ where: { status: "delivered" } }),
      prisma.pregnancy_monitoring.groupBy({
        by: ["current_trimester"],
        where: { status: "ongoing" },
        _count: { current_trimester: true },
      }),
      prisma.pregnancy_monitoring.count({
        where: {
          status:                 "ongoing",
          expected_delivery_date: { gte: today, lte: in30Days },
        },
      }),
      prisma.pregnancy_monitoring.count({
        where: {
          status:                 "ongoing",
          expected_delivery_date: { lt: today },
        },
      }),
      prisma.pregnancy_monitoring.findMany({
        where: { status: "ongoing" },
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id:                     true,
          pregnancy_start_date:   true,
          expected_delivery_date: true,
          current_trimester:      true,
          last_checkup:           true,
          status:                 true,
          health_record: {
            select: {
              resident: {
                select: { f_name: true, l_name: true },
              },
            },
          },
        },
      }),
    ])

    const trimesterBreakdown = [1, 2, 3].map((t) => ({
      trimester: `Trimester ${t}`,
      count:
        trimesterGroups.find((g) => g.current_trimester === t)
          ?._count.current_trimester ?? 0,
    }))

    const recentPregnancies = rawRecentPregnancies.map((p) => ({
      id:                     p.id,
      pregnancy_start_date:   p.pregnancy_start_date,
      expected_delivery_date: p.expected_delivery_date,
      current_trimester:      p.current_trimester,
      last_checkup:           p.last_checkup,
      status:                 p.status,
      resident: {
        f_name: safeDecrypt(p.health_record.resident.f_name),
        l_name: safeDecrypt(p.health_record.resident.l_name),
      },
    }))

    // ── 10. Certificates / Transactions ──────────────────────────────────────
    const [
      totalTransactions,
      pendingTransactions,
      approvedTransactions,
      releasedTransactions,
      rejectedTransactions,
      topCertificateGroups,
      rawRecentTransactions,
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: "pending" } }),
      prisma.transaction.count({ where: { status: "approved" } }),
      prisma.transaction.count({ where: { status: "completed" } }),
      prisma.transaction.count({ where: { status: "rejected" } }),
      prisma.transaction.groupBy({
        by: ["certificate_id"],
        _count: { certificate_id: true },
        orderBy: { _count: { certificate_id: "desc" } },
        take: 5,
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { timestamp: "desc" },
        select: {
          id:               true,
          status:           true,
          timestamp:        true,
          appointment_date: true,
          certificate: {
            select: { template_name: true },
          },
          resident: {
            select: { f_name: true, l_name: true },
          },
        },
      }),
    ])

    const certificateIds = topCertificateGroups.map((t) => t.certificate_id)
    const certificateDetails = await prisma.certificates.findMany({
      where: { id: { in: certificateIds } },
      select: { id: true, template_name: true },
    })

    const topCertificatesWithNames = topCertificateGroups.map((t) => ({
      certificate_name:
        safeDecrypt(                                             // ✅ decrypted
          certificateDetails.find((c) => c.id === t.certificate_id)
            ?.template_name ?? ""
        ) || "Unknown",
      count: t._count.certificate_id,
    }))

    const recentTransactions = rawRecentTransactions.map((t) => ({
      id:               t.id,
      status:           t.status,
      timestamp:        t.timestamp,
      appointment_date: t.appointment_date,
      certificate_name: safeDecrypt(t.certificate.template_name), // ✅ decrypted
      resident: {
        f_name: safeDecrypt(t.resident.f_name),
        l_name: safeDecrypt(t.resident.l_name),
      },
    }))

    // ── 11. Compose response ──────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        residents: {
          total:               totalResidents,
          age_distribution:    ageDistribution,
          gender_distribution: genderDistribution,
          farmers:             farmerCount,
          sectors:             sectorCounts,
          // ✅ Voting status from `voting_status` field
          registered_voters:   registeredVotersCount,
          voting_status: {
            registered:     votingStatusDistribution.registered,
            non_registered: votingStatusDistribution.non_registered,
            unknown:        votingStatusDistribution.unknown,
          },
        },
        blotter: {
          total:    totalBlotter,
          pending:  pendingBlotter,
          resolved: resolvedBlotter,
          ongoing:  ongoingBlotter,
          recent:   recentBlotters,
        },
        complaints: {
          total:     totalComplaints,
          pending:   pendingComplaints,
          ongoing:   ongoingComplaints,
          resolved:  resolvedComplaints,
          dismissed: dismissedComplaints,
          top_types: topComplaintTypes,
          recent:    recentComplaints,
        },
        pregnancy: {
          total:               totalPregnancies,
          ongoing:             ongoingPregnancies,
          delivered:           deliveredPregnancies,
          due_soon_30_days:    dueSoonCount,
          overdue:             overdueCount,
          trimester_breakdown: trimesterBreakdown,
          recent_ongoing:      recentPregnancies,
        },
        certificates: {
          total:         totalTransactions,
          pending:       pendingTransactions,
          approved:      approvedTransactions,
          released:      releasedTransactions,
          rejected:      rejectedTransactions,
          top_requested: topCertificatesWithNames,
          recent:        recentTransactions,
        },
      },
    })
  } catch (error) {
    return handlePrismaError(error, res)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOTALS ONLY — lightweight endpoint for header summary cards
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboardTotals = async (req: Request, res: Response) => {
  try {
    const today = new Date()
    const in30Days = new Date(today)
    in30Days.setDate(in30Days.getDate() + 30)

    // `remarks` and `voting_status` are encrypted → fetch all, decrypt in memory
    const allResidents = await prisma.residents.findMany({
      select: {
        remarks:       true,
        voting_status: true,  // ✅ correct field from residents model
      },
    })

    const activeResidents = allResidents.filter(
      (r) => dec(r.remarks) !== "archive"
    )

    const totalResidents = activeResidents.length

    // ✅ All three voting status counts from `voting_status` field
    const registeredVoters = activeResidents.filter(
      (r) => dec(r.voting_status) === "registered"
    ).length

    const nonRegisteredVoters = activeResidents.filter(
      (r) => dec(r.voting_status) === "non-registered"
    ).length

    const unknownVotingStatus = activeResidents.filter(
      (r) => !dec(r.voting_status)
    ).length

    const [
      totalBlotter,
      pendingBlotter,
      totalTransactions,
      pendingTransactions,
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      ongoingPregnancies,
      dueSoonPregnancies,
    ] = await Promise.all([
      prisma.blotter.count(),
      prisma.blotter.count({ where: { status: "pending" } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: "pending" } }),
      prisma.complaints.count(),
      prisma.complaints.count({ where: { status: "pending" } }),
      prisma.complaints.count({ where: { status: "resolved" } }),
      prisma.pregnancy_monitoring.count({ where: { status: "ongoing" } }),
      prisma.pregnancy_monitoring.count({
        where: {
          status:                 "ongoing",
          expected_delivery_date: { gte: today, lte: in30Days },
        },
      }),
    ])

    return res.status(200).json({
      success: true,
      data: {
        total_residents:       totalResidents,       // non-archived only
        // ✅ Full voting status breakdown
        registered_voters:     registeredVoters,
        non_registered_voters: nonRegisteredVoters,
        unknown_voting_status: unknownVotingStatus,
        total_blotter:         totalBlotter,
        pending_blotter:       pendingBlotter,
        total_transactions:    totalTransactions,
        pending_transactions:  pendingTransactions,
        total_complaints:      totalComplaints,
        pending_complaints:    pendingComplaints,
        resolved_complaints:   resolvedComplaints,
        ongoing_pregnancies:   ongoingPregnancies,
        due_soon_pregnancies:  dueSoonPregnancies,
      },
    })
  } catch (error) {
    return handlePrismaError(error, res)
  }
}