import { Request, Response } from "express"
import prisma from "../prisma"
import { decryptAll, safeDecrypt } from "../utils/crypto.util";
/* CREATE */
export const createPregnancy_monitoring = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = {
      ...req.body,
      pregnancy_start_date: req.body.pregnancy_start_date
        ? new Date(req.body.pregnancy_start_date)
        : null,
      expected_delivery_date: req.body.expected_delivery_date
        ? new Date(req.body.expected_delivery_date)
        : null,
      last_checkup: req.body.last_checkup
        ? new Date(req.body.last_checkup)
        : null,
    }

    const pregnancy_monitoring = await prisma.pregnancy_monitoring.create({
      data,
    })

    res.status(201).json(pregnancy_monitoring)
    console.log("Role: healthworker");
    console.log("Created new pregnancy monitoring record with ID:", pregnancy_monitoring.id);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}


export const getPregnancy_monitoring = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const records = await prisma.pregnancy_monitoring.findMany({
      where: {
        health_record: {
          resident: {
            OR: [
              { remarks: null },
              { remarks: { not: "archive" } },
            ],
          },
        },
      },
      include: {
        health_record: {
          select: {
            id: true,
            details: true,
            resident: {
              select: {
                f_name: true,
                m_name: true,
                l_name: true,
                s_name: true,
                b_date: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formatted = records.map((item) => {
      const resident = item.health_record?.resident;

      const decryptedResident = resident ? decryptAll(resident) : null;

      const fullName = decryptedResident
        ? [
            safeDecrypt(decryptedResident.f_name),
            safeDecrypt(decryptedResident.m_name),
            safeDecrypt(decryptedResident.l_name),
            safeDecrypt(decryptedResident.s_name),
          ]
            .filter(Boolean)
            .join(" ")
        : null;

      // decrypt whole details object
   const rawDetails = item.health_record?.details;

const decryptedDetails =
  rawDetails ? JSON.parse(decryptAll(rawDetails)) : null;



      return {
        ...item,
        health_record: {
          id: item.health_record?.id ?? null,
          fam_no: decryptedDetails?.familyNo ?? null,
        },
        resident: resident
          ? {
              full_name: fullName,
              b_date: decryptedResident?.b_date
                ? new Date(decryptedResident.b_date)
                : null,
            }
          : null,
      };
    });

    res.json(formatted);
    console.log("Fetched pregnancy monitoring records:", formatted.length);
    console.log("Role: healthworker");
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};
export const getMissedVisits = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const records = await prisma.pregnancy_monitoring.findMany({
      where: { 
        status: "ongoing",
        health_record: {
          resident: {
            OR: [
              { remarks: null },
              { remarks: { not: "archive" } },
            ],
          }, 
        },
      },
      include: {
        health_record: {
          select: {
            id: true,
            details: true,
            resident: {
              select: {
                f_name: true,
                m_name: true,
                l_name: true,
                s_name: true,
                b_date: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const TRIMESTER_KEYS = ["1st", "2nd", "3rd"] as const;

    const formatted = records
      .map((item) => {
        // ── Resident ───────────────────────────────────────────────
        const resident = item.health_record?.resident;
        const decryptedResident = resident ? decryptAll(resident) : null;
        const fullName = decryptedResident
          ? [
              safeDecrypt(decryptedResident.f_name),
              safeDecrypt(decryptedResident.m_name),
              safeDecrypt(decryptedResident.l_name),
              safeDecrypt(decryptedResident.s_name),
            ]
              .filter(Boolean)
              .join(" ")
          : null;

        // ── fam_no (from health_record.details) ────────────────────
        const rawHealthDetails = item.health_record?.details;
        const decryptedHealthDetails = rawHealthDetails
          ? JSON.parse(decryptAll(rawHealthDetails))
          : null;

        // ── Pregnancy details — decrypt item.details ───────────────
        const rawDetails = item.details;
        const details = rawDetails
          ? JSON.parse(decryptAll(rawDetails))
          : null;

        const visits = details?.visits;

        // ── Risk code ──────────────────────────────────────────────
        const riskCode = details?.risk?.code?.trim() || null;
        const riskDate = details?.risk?.date?.trim() || null;

        // ── Categorize slots into missed vs incoming ───────────────
        const missedVisits: {
          trimester: string;
          slot: number;
          date: string;
          days_since: number;
        }[] = [];

        const incomingVisits: {
          trimester: string;
          slot: number;
          date: string;
          days_until: number;
        }[] = [];

        for (const trimesterKey of TRIMESTER_KEYS) {
          const slots: any[] = visits?.[trimesterKey] ?? [];

          slots.forEach((slot, index) => {
            const hasDate = slot?.date && slot.date.trim() !== "";
            if (!hasDate) return;

            // A slot is missed/incoming if ALL clinical fields are empty
            const noData =
              (!slot.weight     || slot.weight.trim()     === "") &&
              (!slot.iron       || slot.iron.trim()       === "") &&
              (!slot.aog        || slot.aog.trim()        === "") &&
              (!slot.tt         || slot.tt.trim()         === "") &&
              (!slot.urinalysis || slot.urinalysis.trim() === "") &&
              (!slot.remarks    || slot.remarks.trim()    === "");

            if (!noData) return; // slot was attended, skip

            const appointmentDate = new Date(slot.date);
            appointmentDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor(
              (today.getTime() - appointmentDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (diffDays >= 0) {
              // Past or today with no data = missed
              missedVisits.push({
                trimester: trimesterKey,
                slot: index + 1,
                date: slot.date,
                days_since: diffDays,
              });
            } else {
              // Future appointment = incoming
              incomingVisits.push({
                trimester: trimesterKey,
                slot: index + 1,
                date: slot.date,
                days_until: Math.abs(diffDays),
              });
            }
          });
        }

        // Skip patients with neither missed nor incoming
        if (missedVisits.length === 0 && incomingVisits.length === 0) return null;

        return {
          id: item.id,
          health_record: {
            id: item.health_record?.id ?? null,
            fam_no: decryptedHealthDetails?.familyNo ?? null,
          },
          resident: {
            full_name: fullName,
            b_date: decryptedResident?.b_date
              ? new Date(decryptedResident.b_date).toISOString().split("T")[0]
              : null,
          },
          current_trimester: item.current_trimester,
          last_checkup: item.last_checkup
            ? new Date(item.last_checkup).toISOString().split("T")[0]
            : null,
          risk: riskCode
            ? { code: riskCode, date: riskDate }
            : null,
          missed_visits: missedVisits,
          total_missed: missedVisits.length,
          most_overdue_days:
            missedVisits.length > 0
              ? Math.max(...missedVisits.map((v) => v.days_since))
              : null,
          incoming_visits: incomingVisits,
          total_incoming: incomingVisits.length,
          next_incoming_days:
            incomingVisits.length > 0
              ? Math.min(...incomingVisits.map((v) => v.days_until))
              : null,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        // Sort: patients with missed visits first (most overdue at top),
        // then incoming-only patients sorted by soonest appointment
        const aMissed = a.most_overdue_days ?? -Infinity;
        const bMissed = b.most_overdue_days ?? -Infinity;
        if (bMissed !== aMissed) return bMissed - aMissed;
        return (a.next_incoming_days ?? 0) - (b.next_incoming_days ?? 0);
      });

    res.json(formatted);
    console.log("Fetched pregnancy monitoring records with missed/incoming visits:", formatted.length);
    console.log("Role: healthworker");
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};
/* READ ONE */
export const getPregnancy_monitoringById = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await prisma.pregnancy_monitoring.findUnique({
      where: { id: req.params.id },
      include: {
        health_record: {
          select: {
            id: true,
            details:true,
            resident: {
              select: {
                f_name: true,
                m_name: true,
                l_name: true,
                s_name: true,
                b_date: true,
              }
            }
          }
        }
      }
    });

    if (!record) {
      res.status(404).json({ error: "Pregnancy monitoring record not found." });
      return;
    }

    const resident = record.health_record?.resident;
    const decryptedResident = resident ? decryptAll(resident) : null;

    const fullName = decryptedResident
      ? [
          safeDecrypt(decryptedResident.f_name),
          safeDecrypt(decryptedResident.m_name),
          safeDecrypt(decryptedResident.l_name),
          safeDecrypt(decryptedResident.s_name),
        ]
          .filter(Boolean)
          .join(" ")
      : null;

    const formatted = {
      ...record,
      health_record: {
        id: record.health_record?.id ?? null,
      },
      resident: resident
        ? {
            full_name: fullName,
            b_date: decryptedResident?.b_date
              ? new Date(decryptedResident.b_date)
              : null,
          }
        : null,
    };

    res.json(formatted);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};

/* UPDATE */
export const updatePregnancy_monitoring = async (req: Request, res: Response): Promise<void> => {
  try {
    const pregnancy_monitoring = await prisma.pregnancy_monitoring.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        pregnancy_start_date: req.body.pregnancy_start_date
          ? new Date(req.body.pregnancy_start_date)
          : null,
        expected_delivery_date: req.body.expected_delivery_date
          ? new Date(req.body.expected_delivery_date)
          : null,
        last_checkup: req.body.last_checkup
          ? new Date(req.body.last_checkup)
          : null,
      },
    });

    res.json(pregnancy_monitoring);
    console.log("Role: healthworker");
    console.log("Updated pregnancy monitoring record with ID:", pregnancy_monitoring.id);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};
export const patchPregnancyMonitoringStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status input
    if (!status) {
      res.status(400).json({
        error: "Status is required",
      });
      return;
    }

    // Check if record exists
    const existing = await prisma.pregnancy_monitoring.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        error: "Pregnancy monitoring record not found",
      });
      return;
    }

    // Update only status
    const updatedStatus = await prisma.pregnancy_monitoring.update({
      where: { id },
      data: {
        status,
      },
    });

    res.status(200).json({
      message: "Pregnancy monitoring status updated successfully",
      data: updatedStatus,
    });
    console.log("Role: healthworker");
    console.log(`Updated pregnancy monitoring record ID ${id} to status: ${status}`);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({
        error: err.message,
      });
    } else {
      res.status(500).json({
        error: "Unknown error occurred",
      });
    }
  }
};
/* DELETE */
export const deletePregnancy_monitoring = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.pregnancy_monitoring.delete({
      where: { id: req.params.id },
    })
    console.log("Role: healthworker");
    console.log("Deleted pregnancy monitoring record with ID:", req.params.id);
    res.json({ message: "pregnancy_monitoring deleted successfully" })
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}
