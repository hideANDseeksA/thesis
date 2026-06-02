import { Request, Response } from "express";
import { Emp_Status, Civil, Sex } from "@prisma/client";
import prisma from "../prisma";
import { handlePrismaError } from "../helper/prisma.helper";
import { decryptAll } from "../utils/crypto.util";
import { calculateAge } from "../helper/agecalculator.helper";


/* ------------------------------------------------------------------ */
/* Age brackets — DILG MC Form C layout                                */
/* ------------------------------------------------------------------ */
const AGE_BRACKETS = [
  { label: "under 5 years old",     min: 0,  max: 4        },
  { label: "5-9 years old",         min: 5,  max: 9        },
  { label: "10-14 years old",       min: 10, max: 14       },
  { label: "15-19 years old",       min: 15, max: 19       },
  { label: "20-24 years old",       min: 20, max: 24       },
  { label: "25-29 years old",       min: 25, max: 29       },
  { label: "30-34 years old",       min: 30, max: 34       },
  { label: "35-39 years old",       min: 35, max: 39       },
  { label: "40-44 years old",       min: 40, max: 44       },
  { label: "45-49 years old",       min: 45, max: 49       },
  { label: "50-54 years old",       min: 50, max: 54       },
  { label: "55-59 years old",       min: 55, max: 59       },
  { label: "60-64 years old",       min: 60, max: 64       },
  { label: "65-69 years old",       min: 65, max: 69       },
  { label: "70-74 years old",       min: 70, max: 74       },
  { label: "75-79 years old",       min: 75, max: 79       },
  { label: "80 years old and over", min: 80, max: Infinity },
] as const;

/* ------------------------------------------------------------------ */
/* Sector keywords — matched against plain-text `sector` String field  */
/* emp_status handled separately via Emp_Status enum (strict match)    */
/* ------------------------------------------------------------------ */
const SECTOR_KEYWORDS = {
  overseasFilipinoWorkers: ["ofw"],
  personWithDisabilities:  ["pwd", "person with disab"],
  outOfSchoolChildren:     ["osc", "out of school child"],
  outOfSchoolYouth:        ["osy", "out of school youth"],
  soloParents:             ["solo parent"],
  indigenousPeople:        ["indigenous", "ip"],
  migrants:                ["migrant"],
} as const;

type SectorKey = keyof typeof SECTOR_KEYWORDS;

/* ------------------------------------------------------------------ */
/* Tally helpers                                                        */
/* ------------------------------------------------------------------ */
interface Tally { male: number; female: number; total: number }

function emptyTally(): Tally {
  return { male: 0, female: 0, total: 0 };
}

function inc(tally: Tally, sex: Sex | null): void {
  if (sex === Sex.male)   { tally.male++;   tally.total++; }
  if (sex === Sex.female) { tally.female++; tally.total++; }
}

/** Case-insensitive substring match for plain-text `sector` field */
function hasKeyword(
  field: string | null | undefined,
  keywords: readonly string[]
): boolean {
  if (!field) return false;
  const lower = field.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function ordinal(n: string | null): string {
  if (!n) return "";
  return ({ "1": "st", "2": "nd", "3": "rd" } as Record<string, string>)[n] ?? "th";
}

/* ================================================================== */
/* Controller                                                          */
/* ================================================================== */

/**
 * GET /rbi/form-c
 *
 * Query params:
 *   purok_id  – (optional) filter to a single purok
 *   semester  – "1" | "2"  (optional, label only)
 *   year      – e.g. "2025" (optional, label only)
 */
export const getRBIFormC = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const purokId  = String(req.query.purok_id || "").trim() || undefined;
    const semester = String(req.query.semester  || "").trim() || null;
    const year     = String(req.query.year      || "").trim() || null;

    /* ---------------------------------------------------------------- */
    /* 1. Fetch all active residents                                     */
    /* ---------------------------------------------------------------- */
    const raw = await prisma.residents.findMany({
      where: {
        AND: [
          {
            OR: [
              { remarks: null },
              { remarks: { not: "archive" } },
            ],
          },
          ...(purokId ? [{ purok_id: purokId }] : []),
        ],
      },
      include: {
        purok: { select: { name: true } },
      },
    });

    /* ---------------------------------------------------------------- */
    /* 2. Decrypt encrypted fields & compute age                         */
    /* ---------------------------------------------------------------- */
    const residents = (decryptAll(raw) as any[]).map((r) => ({
      ...r,
      age: r.b_date ? (calculateAge(r.b_date) as number) : null,
    }));

    /* ---------------------------------------------------------------- */
    /* 3. Top-level totals                                              */
    /* ---------------------------------------------------------------- */
    const totalInhabitants = residents.length;
    const distinctPuroks   = new Set(residents.map((r) => r.purok_id).filter(Boolean));
    // ✅ CORRECT — counts unique house_no + purok_id combinations
const distinctHouseholds = new Set(
  residents
    .filter((r) => r.house_no && r.purok_id)
    .map((r) => `${r.purok_id}::${r.house_no}`)
);
const totalHouseholds = distinctHouseholds.size;

    /* ---------------------------------------------------------------- */
    /* 4. Population by Age Bracket                                     */
    /* ---------------------------------------------------------------- */
    const ageTallyMap = new Map<string, Tally>(
      AGE_BRACKETS.map((b) => [b.label, emptyTally()])
    );

    for (const r of residents) {
      const age = r.age as number | null;
      if (age === null) continue;
      const bracket = AGE_BRACKETS.find((b) => age >= b.min && age <= b.max);
      if (bracket) inc(ageTallyMap.get(bracket.label)!, r.sex as Sex);
    }

    const populationByAgeBracket = AGE_BRACKETS.map((b) => ({
      bracket: b.label,
      ...ageTallyMap.get(b.label)!,
    }));

    /* ---------------------------------------------------------------- */
    /* 5. Population by Sector                                          */
    /* ---------------------------------------------------------------- */

    // emp_status enum tallies (strict enum comparison — no string parsing)
    const empTallies: Record<Emp_Status, Tally> = {
      [Emp_Status.employed]:   emptyTally(),
      [Emp_Status.unemployed]: emptyTally(),
      [Emp_Status.student]:    emptyTally(),
      [Emp_Status.retired]:    emptyTally(),
      [Emp_Status.unknown]:    emptyTally(),
    };

    // sector string keyword tallies
    const sectorTallies = Object.fromEntries(
      (Object.keys(SECTOR_KEYWORDS) as SectorKey[]).map((k) => [k, emptyTally()])
    ) as Record<SectorKey, Tally>;

    // Senior Citizen: age-derived only (60+ per DILG MC — no sector keyword needed)
    const seniorCitizenTally = emptyTally();

    for (const r of residents) {
      const sex       = r.sex       as Sex          | null;
      const empStatus = r.emp_status as Emp_Status  | null;
      const sector    = r.sector    as string       | null;
      const age       = r.age       as number       | null;

      /* --- Emp_Status enum (strict) --------------------------------- */
      if (empStatus && empStatus in empTallies) {
        inc(empTallies[empStatus], sex);
      }

      /* --- sector plain-string keyword matches ----------------------- */
      if (hasKeyword(sector, SECTOR_KEYWORDS.overseasFilipinoWorkers)) {
        inc(sectorTallies.overseasFilipinoWorkers, sex);
      }
      if (hasKeyword(sector, SECTOR_KEYWORDS.personWithDisabilities)) {
        inc(sectorTallies.personWithDisabilities, sex);
      }
      // OSC: keyword + age gate 6–14 (DILG MC definition)
      if (age !== null && age >= 6 && age <= 14 &&
          hasKeyword(sector, SECTOR_KEYWORDS.outOfSchoolChildren)) {
        inc(sectorTallies.outOfSchoolChildren, sex);
      }
      // OSY: keyword + age gate 15–24 (DILG MC definition)
      if (age !== null && age >= 15 && age <= 24 &&
          hasKeyword(sector, SECTOR_KEYWORDS.outOfSchoolYouth)) {
        inc(sectorTallies.outOfSchoolYouth, sex);
      }
      if (hasKeyword(sector, SECTOR_KEYWORDS.soloParents)) {
        inc(sectorTallies.soloParents, sex);
      }
      if (hasKeyword(sector, SECTOR_KEYWORDS.indigenousPeople)) {
        inc(sectorTallies.indigenousPeople, sex);
      }
      if (hasKeyword(sector, SECTOR_KEYWORDS.migrants)) {
        inc(sectorTallies.migrants, sex);
      }

      /* --- Senior Citizen: purely age-derived (60+) ----------------- */
      if (age !== null && age >= 60) {
        inc(seniorCitizenTally, sex);
      }
    }

    /* ---------------------------------------------------------------- */
    /* 6. Civil Status                                                   */
    /*    Uses actual Civil enum values from schema:                     */
    /*      single | married | widow | seperated | annulled | co_habitation */
    /*    NOTE: "seperated" matches schema spelling exactly              */
    /* ---------------------------------------------------------------- */
    const civilTallies: Record<Civil, Tally> = {
      [Civil.single]:        emptyTally(),
      [Civil.married]:       emptyTally(),
      [Civil.widow]:         emptyTally(),
      [Civil.seperated]:     emptyTally(), // intentional schema spelling
      [Civil.annulled]:      emptyTally(),
      [Civil.co_habitation]: emptyTally(),
    };

    for (const r of residents) {
      const cs = r.civil_status as Civil | null;
      if (cs && cs in civilTallies) {
        inc(civilTallies[cs], r.sex as Sex);
      }
    }

    /* ---------------------------------------------------------------- */
    /* 7. Citizenship (ENCRYPTED → decrypted in step 2)                 */
    /* ---------------------------------------------------------------- */
    const citizenshipTallies = {
      filipino:         emptyTally(),
      dual_citizenship: emptyTally(),
      foreigner:        emptyTally(),
    };

    for (const r of residents) {
      const c   = (r.citizenship as string | null)?.toLowerCase() ?? "";
      const sex = r.sex as Sex | null;
      if      (c.includes("dual"))    inc(citizenshipTallies.dual_citizenship, sex);
      else if (c.includes("foreign")) inc(citizenshipTallies.foreigner, sex);
      else if (c !== "")              inc(citizenshipTallies.filipino, sex);
    }

    /* ---------------------------------------------------------------- */
    /* 8. Purok label                                                    */
    /* ---------------------------------------------------------------- */
    let purokLabel = "All Puroks";
    if (purokId && residents.length > 0) {
      purokLabel = (residents[0]?.purok as any)?.name ?? purokId;
    }

    /* ---------------------------------------------------------------- */
    /* 9. Send Form C response                                          */
    /* ---------------------------------------------------------------- */
    res.json({
      meta: {
        form:            "RBI Form C – Semestral Monitoring Form for Barangays",
        semester:        semester ? `${semester}${ordinal(semester)} Semester` : null,
        year:            year ?? null,
        purok:           purokLabel,
        totalInhabitants,
        totalHouseholds,
        totalFamilies:   totalInhabitants, // replace if a families table exists
      },

      /* Form C: Population by Age Bracket */
      populationByAgeBracket,

      /* Form C: Population by Sector */
      populationBySector: {
        laborForceEmployed:      empTallies[Emp_Status.employed],
        unemployed:              empTallies[Emp_Status.unemployed],
        overseasFilipinoWorkers: sectorTallies.overseasFilipinoWorkers,
        personWithDisabilities:  sectorTallies.personWithDisabilities,
        outOfSchoolChildren:     sectorTallies.outOfSchoolChildren,  // 6-14 yrs
        outOfSchoolYouth:        sectorTallies.outOfSchoolYouth,     // 15-24 yrs
        seniorCitizen:           seniorCitizenTally,                 // 60+ yrs
        soloParents:             sectorTallies.soloParents,
        indigenousPeople:        sectorTallies.indigenousPeople,
        migrants:                sectorTallies.migrants,
      },

      /* Form C: Civil Status rows — exact Civil enum values */
      civilStatus: {
        single:        civilTallies[Civil.single],
        married:       civilTallies[Civil.married],
        widow:         civilTallies[Civil.widow],
        separated:     civilTallies[Civil.seperated],     // display key is clean
        annulled:      civilTallies[Civil.annulled],
        coHabitation:  civilTallies[Civil.co_habitation],
      },

      /* Form C: Citizenship rows */
      citizenship: {
        filipino:        citizenshipTallies.filipino,
        dualCitizenship: citizenshipTallies.dual_citizenship,
        foreigner:       citizenshipTallies.foreigner,
      },

      /* Extra: full employment breakdown (all Emp_Status values) */
      employmentBreakdown: {
        employed:   empTallies[Emp_Status.employed],
        unemployed: empTallies[Emp_Status.unemployed],
        student:    empTallies[Emp_Status.student],
        retired:    empTallies[Emp_Status.retired],
        unknown:    empTallies[Emp_Status.unknown],
      },
    });
  } catch (err) {
    handlePrismaError(err, res);
  }
};