import prisma from "../prisma"

import { sendMail } from "../helper/mail.helper";
import { decryptAll, safeDecrypt } from "../utils/crypto.util";


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const calculateTrimester = (startDate: Date): number => {
  const now = new Date();
  const weeks = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );
  if (weeks <= 12) return 1;
  if (weeks <= 26) return 2;
  return 3;
};

function buildFullName(resident: Record<string, any> | null): string {
  if (!resident) return "Unknown";
  return (
    [
      safeDecrypt(resident.f_name),
      safeDecrypt(resident.m_name),
      safeDecrypt(resident.l_name),
      safeDecrypt(resident.s_name),
    ]
      .filter(Boolean)
      .join(" ") || "Unknown"
  );
}

function parseEncrypted(raw: string | null | undefined): any {
  if (!raw) return null;
  try {
    return JSON.parse(decryptAll(raw));
  } catch {
    return null;
  }
}

function isSlotEmpty(slot: any): boolean {
  return ["weight", "iron", "aog", "tt", "urinalysis", "remarks"].every(
    (f) => !slot?.[f] || slot[f].trim() === ""
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overdue detection
// ─────────────────────────────────────────────────────────────────────────────

const TRIMESTER_KEYS = ["1st", "2nd", "3rd"] as const;

interface OverdueSlot {
  trimester: string;
  slot: number;
  date: string;
  days_since: number;
}

interface OverdueResident {
  full_name: string;
  overdue_visits: OverdueSlot[];
  most_overdue_days: number;
}

function getOverdueSlots(details: any, today: Date): OverdueSlot[] {
  const visits = details?.visits;
  const overdue: OverdueSlot[] = [];

  for (const trimesterKey of TRIMESTER_KEYS) {
    const slots: any[] = visits?.[trimesterKey] ?? [];

    slots.forEach((slot, index) => {
      if (!slot?.date || slot.date.trim() === "") return;
      if (!isSlotEmpty(slot)) return;

      const appointmentDate = new Date(slot.date);
      appointmentDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays >= 0) {
        overdue.push({
          trimester: trimesterKey,
          slot: index + 1,
          date: slot.date,
          days_since: diffDays,
        });
      }
    });
  }

  return overdue;
}

// ─────────────────────────────────────────────────────────────────────────────
// Email builder
// ─────────────────────────────────────────────────────────────────────────────

function buildAlertEmail(overdueList: OverdueResident[]): string {
  const rows = overdueList
    .sort((a, b) => b.most_overdue_days - a.most_overdue_days)
    .map((r) => {
      const visitLines = r.overdue_visits
        .map(
          (v) =>
            `<tr>
              <td style="padding:4px 12px;">${v.trimester} trimester – Visit ${v.slot}</td>
              <td style="padding:4px 12px;">${v.date}</td>
              <td style="padding:4px 12px; color:#c0392b; font-weight:bold;">${v.days_since} day(s) overdue</td>
            </tr>`
        )
        .join("");

      return `
        <tr>
          <td colspan="3" style="padding:10px 12px 4px; font-weight:bold; background:#fef9f0;">
            👤 ${r.full_name}
          </td>
        </tr>
        ${visitLines}
        <tr><td colspan="3" style="padding:0;"><hr style="border:none;border-top:1px solid #eee;"/></td></tr>`;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
      <div style="background:#2e86c1;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;">⚠️ Overdue Prenatal Visit Alert</h2>
        <p style="margin:6px 0 0;font-size:14px;">
          The following residents have missed scheduled prenatal checkups as of
          <strong>${new Date().toDateString()}</strong>.
        </p>
      </div>
      <div style="border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;padding:16px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f2f2f2;">
              <th style="padding:8px 12px;text-align:left;">Visit</th>
              <th style="padding:8px 12px;text-align:left;">Scheduled Date</th>
              <th style="padding:8px 12px;text-align:left;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <p style="margin-top:20px;font-size:13px;color:#555;">
          Please follow up with these residents at the earliest opportunity.
          This is an automated alert from <strong>Smart Barangay</strong>.
        </p>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main service
// ─────────────────────────────────────────────────────────────────────────────

export const updateTrimesterService = async () => {
  console.log("🚀 Starting trimester update service...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── 1. Fetch all ongoing pregnancy records ────────────────────────────────
  const records = await prisma.pregnancy_monitoring.findMany({
    where: { status: "ongoing" },
    include: {
      health_record: {
        select: {
          resident: {
            select: {
              f_name: true,
              m_name: true,
              l_name: true,
              s_name: true,
            },
          },
        },
      },
    },
  });

  console.log(`📊 Found ${records.length} ongoing pregnancy records`);

  const overdueResidents: OverdueResident[] = [];

  // ── 2. Update trimesters & collect overdue ────────────────────────────────
  for (const record of records) {
    if (!record.pregnancy_start_date) {
      console.log(`⚠️  Skipping record ${record.id} (no start date)`);
      continue;
    }

    const start = new Date(record.pregnancy_start_date);
    const diffWeeks = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );

    const trimester = calculateTrimester(start);
    const status = diffWeeks >= 40 ? "delivered" : "ongoing";

    console.log(
      `🔍 Record ${record.id} | Weeks: ${diffWeeks} | Trimester: ${trimester} | Status: ${status}`
    );

    await prisma.pregnancy_monitoring.update({
      where: { id: record.id },
      data: { current_trimester: trimester, status },
    });

    console.log(`✅ Updated record ${record.id}`);

    // Only check overdue for still-ongoing records
    if (status === "ongoing") {
      const details = parseEncrypted((record as any).details);
      const overdueSlots = getOverdueSlots(details, today);

      if (overdueSlots.length > 0) {
        const rawResident = record.health_record?.resident ?? null;
        const decryptedResident = rawResident ? decryptAll(rawResident) : null;

        overdueResidents.push({
          full_name: buildFullName(decryptedResident),
          overdue_visits: overdueSlots,
          most_overdue_days: Math.max(...overdueSlots.map((v) => v.days_since)),
        });
      }
    }
  }

  console.log(`🎉 All pregnancy records updated successfully`);

  // ── 3. Send alert only if there are overdue residents ────────────────────
  if (overdueResidents.length === 0) {
    console.log("✅ No overdue visits found. No alert email sent.");
    return;
  }

  console.log(
    `📋 ${overdueResidents.length} resident(s) with overdue visits. Fetching healthworker emails...`
  );

  // ── 4. Fetch healthworker emails ─────────────────────────────────────────
  const healthworkers = await prisma.user.findMany({
    where: { role: "healthworker" },
    include: {
      resident: {
        select: { email_address: true },
      },
    },
  });

  const emailTargets = healthworkers
    .map((hw) => safeDecrypt(hw.resident.email_address))
    .filter((email): email is string => Boolean(email));

  if (emailTargets.length === 0) {
    console.warn("⚠️  No healthworker emails found. Skipping alert.");
    return;
  }

  console.log(
    `📧 Sending alert to ${emailTargets.length} healthworker(s): ${emailTargets.join(", ")}`
  );

  // ── 5. Send email ─────────────────────────────────────────────────────────
  await sendMail({
    to: emailTargets.join(", "),
    subject: `⚠️ Overdue Prenatal Visits – ${overdueResidents.length} Resident(s) Need Follow-Up`,
    html: buildAlertEmail(overdueResidents),
    text: overdueResidents
      .map(
        (r) =>
          `${r.full_name}: ${r.overdue_visits.length} overdue visit(s), most overdue by ${r.most_overdue_days} day(s).`
      )
      .join("\n"),
  });

  console.log("📬 Alert email sent successfully.\n");
};