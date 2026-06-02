import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import {
  User, Info, Heart, GraduationCap, Briefcase,
  ShieldCheck, Users, ArrowLeft, ArrowRight,
  Loader2, Check, ChevronLeft, FileHeart,
} from "lucide-react";

// ── Import your API service functions ────────────────────────────────────────
import { getResidentDatabyId } from "@/api/resident";
import {
  createHealthRecord,
  getHealthRecordById,
  updateHealthRecord,
} from "@/api/health";
import { showWarningAlert } from "@/utils/dialog";
import { toastSuccess,toastError } from "@/utils/toast";
/* ─── Constants ───────────────────────────────────────────────────────────── */
const CIVIL_STATUS_MAP = {
  single: "single", married: "married",
  widow: "widow", widower: "widow",
  separated: "separated", seperated: "separated",
  annulled: "annulled",
  cohabitation: "cohabitation", co_habitation: "cohabitation",
};
const EDUCATION_MAP = {
  none: "none",
  elementary: "elementary",
  "high school": "highschool", highschool: "highschool",
  vocational: "vocational",
  college: "college",
  "post graduate": "postgrad", postgrad: "postgrad", postgraduate: "postgrad",
};
const EMPLOYMENT_MAP = {
  student: "student", employed: "employed", retired: "retired",
  none: "none", unemployed: "none", unknown: "unknown",
};

const CIVIL_OPTIONS = [
  { value: "single",       en: "Single",       fil: "Walang Asawa" },
  { value: "widow",        en: "Widow/er",      fil: "Balo" },
  { value: "married",      en: "Married",       fil: "May Asawa" },
  { value: "separated",    en: "Separated",     fil: "Hiwalay" },
  { value: "annulled",     en: "Annulled",      fil: "Anulado" },
  { value: "cohabitation", en: "Co-Habitation", fil: "Paninirahang magkasama" },
];
const EDUCATION_OPTIONS = [
  { value: "none",       en: "No Formal Education", fil: "Walang Pormal na Edukasyon" },
  { value: "elementary", en: "Elementary",           fil: "Elementarya" },
  { value: "highschool", en: "High School",          fil: "Hayskul" },
  { value: "vocational", en: "Vocational",           fil: "Bokasyunal" },
  { value: "college",    en: "College",              fil: "Kolehiyo" },
  { value: "postgrad",   en: "Post Graduate",        fil: "" },
];
const EMPLOYMENT_OPTIONS = [
  { value: "student",  en: "Student",         fil: "Estudyante" },
  { value: "unknown",  en: "Unknown",         fil: "Hindi malaman" },
  { value: "employed", en: "Employed",        fil: "May trabaho" },
  { value: "retired",  en: "Retired",         fil: "Retirado" },
  { value: "none",     en: "None/Unemployed", fil: "Walang Trabaho" },
];
const FAMILY_OPTIONS = [
  { value: "father",   en: "Father",   fil: "Ama" },
  { value: "mother",   en: "Mother",   fil: "Ina" },
  { value: "son",      en: "Son",      fil: "Anak na Lalaki" },
  { value: "daughter", en: "Daughter", fil: "Anak na Babae" },
  { value: "others",   en: "Others",   fil: "Iba" },
];
const EMP_TYPES = [
  { value: "fe_private",    label: "FE – Private" },
  { value: "fe_government", label: "FE – Government" },
  { value: "ie",            label: "IE" },
  { value: "others",        label: "Others" },
];

const STEPS = [
  { id: "name",       label: "Full Name",    sub: "Identity details",      icon: User },
  { id: "basic",      label: "Basic Info",   sub: "Sex, vitals & address", icon: Info },
  { id: "civil",      label: "Civil Status", sub: "Marital info",          icon: Heart },
  { id: "education",  label: "Education",    sub: "Attainment level",      icon: GraduationCap },
  { id: "employment", label: "Employment",   sub: "Work status",           icon: Briefcase },
  { id: "philhealth", label: "PhilHealth",   sub: "Insurance & benefits",  icon: ShieldCheck },
  { id: "family",     label: "Family",       sub: "Position & PCB",        icon: Users },
];

const INITIAL_FORM = {
  lastName: "", suffix: "", firstName: "", middleName: "", maidenName: "",
  sex: "", birthDate: "", birthPlace: "", bloodType: "",
  civilStatus: "", education: "", employmentStatus: "", address: "",
  motherName: "", spouseName: "", fourPs: "",
  philHealthMember: "", philHealthStatus: "", philHealthNo: "",
  employmentType: "", familyPosition: "", familyOther: "",
  employmentOther: "", pcbMember: "", familyNo: "",
  weight: "", height: "",
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function parseDetails(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

function buildAddress(r) {
  if (r?.purok?.name) {
    return `${r.purok.name}, Barangay Lag-on Daet Camarines Norte`;
  }
  return r?.house_no ?? "";
}

function normalizeFromResident(residentData) {
  const r = residentData?.data ?? residentData;

  const rawCivil      = (r.civil_status ?? "").toLowerCase();
  const rawEducation  = (r.education    ?? "").toLowerCase();
  const rawEmployment = (r.emp_status   ?? "").toLowerCase();

  return {
    ...INITIAL_FORM,
    _residentId: r.id ?? r.resident_id ?? "",
    lastName:   r.l_name  ?? "",
    suffix:     r.s_name  ?? "",
    firstName:  r.f_name  ?? "",
    middleName: r.m_name  ?? "",
    maidenName: r.md_name ?? "",
    sex:        r.sex     ?? "",
    birthDate: r.b_date
      ? new Date(r.b_date).toISOString().split("T")[0]
      : "",
    birthPlace: r.b_place    ?? "",
    bloodType:  r.blood_type ?? "",
    address:    buildAddress(r),
    civilStatus:      CIVIL_STATUS_MAP[rawCivil]      ?? "",
    education:        EDUCATION_MAP[rawEducation]     ?? "",
    employmentStatus: EMPLOYMENT_MAP[rawEmployment]   ?? "",
    motherName: "", spouseName: "", fourPs: "",
    philHealthMember: "", philHealthStatus: "", philHealthNo: "",
    employmentType: "", familyPosition: "", familyOther: "",
    employmentOther: "", pcbMember: "", familyNo: "",
    weight: "", height: "",
  };
}

function normalizeFromHealthRecord(record) {
  const raw = record?.data ?? record;
  const r   = raw?.resident ?? {};
  const d   = parseDetails(raw?.details);
  const phil = d?.philHealth ?? {};

  const rawCivil      = (r.civil_status ?? "").toLowerCase();
  const rawEducation  = (r.education    ?? "").toLowerCase();
  const rawEmployment = (r.emp_status   ?? "").toLowerCase();

  return {
    _residentId: raw?.resident_id ?? r?.id ?? "",
    lastName:   r.l_name  ?? "",
    suffix:     r.s_name  ?? "",
    firstName:  r.f_name  ?? "",
    middleName: r.m_name  ?? "",
    maidenName: r.md_name ?? "",
    sex:        r.sex     ?? "",
    birthDate: r.b_date
      ? new Date(r.b_date).toISOString().split("T")[0]
      : "",
    birthPlace: d.birthPlace ?? r.b_place    ?? "",
    bloodType:  d.bloodType  ?? r.blood_type ?? "",
    address:    buildAddress(r),
    civilStatus:      d.civilStatus      ?? CIVIL_STATUS_MAP[rawCivil]    ?? "",
    education:        d.education        ?? EDUCATION_MAP[rawEducation]   ?? "",
    employmentStatus: d.employmentStatus ?? EMPLOYMENT_MAP[rawEmployment] ?? "",
    motherName:       d.motherName       ?? "",
    spouseName:       d.spouseName       ?? "",
    fourPs:           d.fourPs           ?? "",
    philHealthMember: phil.member         ?? "",
    philHealthStatus: phil.status         ?? "",
    philHealthNo:     phil.no             ?? "",
    employmentType:   phil.employmentType ?? "",
    familyPosition:  d.familyPosition  ?? "",
    familyOther:     d.familyOther     ?? "",
    employmentOther: d.employmentOther ?? "",
    pcbMember:       d.pcbMember       ?? "",
    familyNo:        d.familyNo        ?? "",
    weight: raw?.weight != null ? String(raw.weight) : "",
    height: raw?.height != null ? String(raw.height) : "",
  };
}

/* ─── Per-step validation ─────────────────────────────────────────────────── */
/**
 * Returns an array of error message strings for the given step.
 * Empty array = step is valid and may proceed.
 */
function validateStep(stepIndex, form) {
  const errors = [];

  switch (stepIndex) {
    case 0: // Full Name — all read-only, always valid
      break;

    case 1: // Basic Info — weight & height required
      if (!form.weight || parseFloat(form.weight) <= 0)
        errors.push("Weight is required.");
      if (!form.height || parseFloat(form.height) <= 0)
        errors.push("Height is required.");
      break;

    case 2: // Civil Status — 4Ps & mother name always required; spouse when married/cohabiting
      if (!form.fourPs)
        errors.push("Please indicate 4Ps membership (Yes or No).");
      if (!form.motherName.trim())
        errors.push("Mother's name is required.");
      if (
        (form.civilStatus === "married" || form.civilStatus === "cohabitation") &&
        !form.spouseName.trim()
      )
        errors.push("Spouse's name is required for married / co-habitation status.");
      break;

    case 3: // Education — read-only, always valid
      break;

    case 4: // Employment — read-only, always valid
      break;

    case 5: // PhilHealth
      if (!form.philHealthMember)
        errors.push("Please indicate PhilHealth membership (Yes or No).");
      if (form.philHealthMember === "yes") {
        if (!form.philHealthStatus)
          errors.push("Please select a PhilHealth status type.");
        if (!form.philHealthNo.trim())
          errors.push("PhilHealth number is required.");
        if (!form.employmentType)
          errors.push("Please select an employment type.");
      }
      break;

    case 6: // Family
      if (!form.familyPosition)
        errors.push("Please select a family position.");
      if (form.familyPosition === "others" && !form.familyOther.trim())
        errors.push("Please specify the family position.");
      if (!form.familyNo.trim())
        errors.push("Family number is required.");
      if (!form.pcbMember)
        errors.push("Please indicate PCB membership (Yes or No).");
      break;

    default:
      break;
  }

  return errors;
}

function calcBmi(weight, height) {
  const w = parseFloat(weight);
  const h = parseFloat(height) / 100;
  if (!w || !h || h <= 0) return null;
  const val = w / (h * h);
  let category = "Obese";
  if (val < 18.5)      category = "Underweight";
  else if (val < 25)   category = "Normal";
  else if (val < 30)   category = "Overweight";
  return { val: val.toFixed(1), raw: val, category };
}

const BMI_STYLES = {
  Normal:      "bg-green-100 text-green-700",
  Underweight: "bg-blue-100 text-blue-700",
  Overweight:  "bg-yellow-100 text-yellow-700",
  Obese:       "bg-red-100 text-red-700",
};

/* ─── UI Primitives ───────────────────────────────────────────────────────── */

// Required asterisk helper
function Req() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

function DisplayField({ label, fil, value, className = "" }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[11px] font-medium text-muted-foreground">
        {label}
        {fil && <span className="font-normal italic ml-1">({fil})</span>}
      </p>
      <p className={`text-sm font-medium min-h-[34px] px-3 py-2 rounded-md bg-muted/40 border border-border/50 capitalize
        ${!value ? "text-muted-foreground/50 italic" : "text-foreground"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function FieldLabel({ en, fil, required = false }) {
  return (
    <Label className="text-[11px] font-medium text-muted-foreground">
      {en}
      {required && <Req />}
      {fil && <span className="font-normal italic ml-1">({fil})</span>}
    </Label>
  );
}

function SelectionBadge({ options, value }) {
  const match = options.find((o) => o.value === value);
  if (!match) return <p className="text-sm text-muted-foreground italic py-1">Not specified</p>;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-foreground/5 border border-foreground/10">
      <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 shrink-0" />
      <span className="text-sm font-medium">{match.en}</span>
      {match.fil && <span className="text-xs text-muted-foreground italic">({match.fil})</span>}
    </div>
  );
}

function InfoBanner({ message }) {
  return (
    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-[11px] text-amber-700 flex items-center gap-2">
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      </svg>
      {message}
    </div>
  );
}

function StatusBanner({ type, message }) {
  const ok = type === "success";
  return (
    <div className={`flex items-center gap-2 text-xs rounded-md px-3 py-2.5 border mt-3
      ${ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}>
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {ok
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
      </svg>
      {message}
    </div>
  );
}

function ValidationBanner({ errors }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5 text-xs rounded-md px-3 py-2.5 border mt-3 text-red-700 bg-red-50 border-red-200">
      <div className="flex items-center gap-1.5 font-semibold">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Please complete the required fields:
      </div>
      <ul className="list-disc list-inside space-y-0.5 pl-1">
        {errors.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
}

function StepSidebar({ activeStep, completedSteps, onGoToStep, residentName, recordId, isEditing }) {
  // FIX: Include the active step in progress so step 7/7 = 100%
  const visitedCount = new Set([...completedSteps, activeStep]).size;
  const progress = Math.round((visitedCount / STEPS.length) * 100);

  return (
    
    <aside className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border border-border">
            <FileHeart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Health Record</p>
            <p className="text-xs font-semibold leading-tight">{isEditing ? "Edit Form" : "New Form"}</p>
          </div>
        </div>
        {residentName && (
          <div className="flex items-center gap-1.5 mt-2">
            <User size={10} className="text-muted-foreground shrink-0" />
            {/* FIX: capitalize resident name in sidebar */}
            <span className="text-[11px] text-muted-foreground truncate capitalize">{residentName}</span>
          </div>
        )}
        {recordId && <p className="text-[9px] text-muted-foreground/60 mt-0.5">#{recordId}</p>}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {STEPS.map((step, idx) => {
          const Icon     = step.icon;
          const isActive = activeStep === idx;
          // FIX: a step is "done" if it's in completedSteps OR it's before the current active step
          const isDone   = completedSteps.has(idx) || idx < activeStep;
          const isAhead  = idx > activeStep;
          return (
            <div key={step.id} className="relative">
              {idx < STEPS.length - 1 && (
                <div className={`absolute left-[19px] top-[38px] w-px h-3 transition-colors
                  ${isDone ? "bg-foreground/30" : "bg-border"}`} />
              )}
              <button
                onClick={() => onGoToStep(idx)}
                className={`w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-all
                  ${isActive ? "bg-background shadow-sm border border-border/60" : "hover:bg-background/60"}
                  ${isAhead ? "opacity-40" : ""}`}
              >
                <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all
                  ${isActive ? "border-foreground bg-foreground text-background"
                    : isDone  ? "border-green-500 bg-green-500 text-white"
                    : "border-border text-muted-foreground"}`}>
                  {isDone && !isActive ? <Check size={10} /> : <Icon size={10} />}
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[11px] font-semibold leading-tight truncate">{step.label}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight truncate">{step.sub}</p>
                </div>
              </button>
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex justify-between mb-1.5">
          <span className="text-[9px] text-muted-foreground">Progress</span>
          <span className="text-[9px] font-medium">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </aside>
  );
}

/* ─── Step Panels ─────────────────────────────────────────────────────────── */

function StepName({ form }) {
  const fullName = [form.firstName, form.middleName, form.lastName, form.suffix]
    .filter(Boolean).join(" ") || "—";
  return (
    <div className="space-y-4">
      <InfoBanner message="These fields are prefilled from the resident record and cannot be edited here." />
      <div className="grid grid-cols-2 gap-3">
        <DisplayField label="Last Name"  fil="Apelyido"          value={form.lastName} />
        <DisplayField label="Suffix"                             value={form.suffix} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DisplayField label="First Name"   fil="Pangalan"         value={form.firstName} />
        <DisplayField label="Middle Name"  fil="Gitnang Pangalan" value={form.middleName} />
      </div>
      <DisplayField label="Maiden Name" fil="Para sa mga may-asawa" value={form.maidenName} />
      <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border">
        <p className="text-[10px] text-muted-foreground mb-0.5">Full name</p>
        {/* FIX: capitalize full name preview */}
        <p className="text-sm font-semibold capitalize">{fullName}</p>
      </div>
    </div>
  );
}

function StepBasic({ form, set, bmi, validationErrors = [] }) {
  const errWeight = validationErrors.some(e => e.toLowerCase().includes("weight"));
  const errHeight = validationErrors.some(e => e.toLowerCase().includes("height"));
  return (
    <div className="space-y-4">
      <InfoBanner message="Sex, birth date, birthplace, and blood type are from the resident record. Weight and height are editable." />

      <div className="grid grid-cols-3 gap-3">
        <DisplayField
          label="Sex" fil="Kasarian"
          value={form.sex === "female" ? "Female (Babae)" : form.sex === "male" ? "Male (Lalaki)" : ""}
        />
        <DisplayField label="Birth Date"  fil="Kapanganakan" value={form.birthDate} />
        <DisplayField label="Birthplace"                     value={form.birthPlace} />
      </div>
      <DisplayField label="Blood Type" value={form.bloodType} />

      <div className="pt-1 border-t border-border">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Editable vitals
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* FIX: weight required */}
          <div className="space-y-1.5">
            <FieldLabel en="Weight" fil="kg" required />
            <div className="relative">
              <Input
                type="number" min="0" step="0.1"
                className={`h-9 text-sm pr-8 ${errWeight ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                placeholder="65"
                value={form.weight}
                onChange={(e) => set("weight", e.target.value)}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">kg</span>
            </div>
          </div>
          {/* FIX: height required */}
          <div className="space-y-1.5">
            <FieldLabel en="Height" fil="cm" required />
            <div className="relative">
              <Input
                type="number" min="0" step="0.1"
                className={`h-9 text-sm pr-8 ${errHeight ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                placeholder="165"
                value={form.height}
                onChange={(e) => set("height", e.target.value)}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">cm</span>
            </div>
          </div>
        </div>
        {bmi && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-muted/40 border border-border mt-2 text-xs">
            <span className="text-muted-foreground">BMI</span>
            <span className="font-semibold text-sm">{bmi.val}</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${BMI_STYLES[bmi.category]}`}>
              {bmi.category}
            </span>
          </div>
        )}
      </div>

      <DisplayField label="Residential Address" fil="Tirahan" value={form.address} />
    </div>
  );
}

function StepCivil({ form, set, validationErrors = [] }) {
  const showSpouse = form.civilStatus === "married" || form.civilStatus === "cohabitation";
  const errSpouse  = validationErrors.some(e => e.toLowerCase().includes("spouse"));
  const errFourPs  = validationErrors.some(e => e.toLowerCase().includes("4ps"));
  const errMother  = validationErrors.some(e => e.toLowerCase().includes("mother"));
  return (
    <div className="space-y-4">
      <InfoBanner message="Civil status is from the resident record. Spouse name, 4Ps, and mother's name are editable." />

      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          Civil Status <span className="italic">(Katayuang Sibil)</span>
        </p>
        <SelectionBadge options={CIVIL_OPTIONS} value={form.civilStatus} />
      </div>

      {showSpouse && (
        <div className="space-y-1.5">
          {/* FIX: spouse name required when married/cohabitation, capitalize */}
          <FieldLabel en="Spouse's Name" fil="Asawa" required />
          <Input
            className={`h-9 text-sm capitalize ${errSpouse ? "border-red-400 focus-visible:ring-red-300" : ""}`}
            placeholder="Spouse's full name"
            value={form.spouseName}
            onChange={(e) => set("spouseName", e.target.value)}
            required
          />
        </div>
      )}

      <div className="pt-3 border-t border-border">
        <div className={`flex items-center justify-between rounded-md px-2 py-1 -mx-2 ${errFourPs ? "bg-red-50 outline outline-1 outline-red-300 rounded-md" : ""}`}>
          {/* FIX: 4Ps required */}
          <Label className="text-xs font-medium">
            4Ps Member?<Req />
          </Label>
          <RadioGroup value={form.fourPs} onValueChange={(v) => set("fourPs", v)} className="flex gap-4">
            {["yes", "no"].map((v) => (
              <div key={v} className="flex items-center gap-1.5">
                <RadioGroupItem value={v} id={`fourps-${v}`} />
                <Label htmlFor={`fourps-${v}`} className="cursor-pointer text-xs font-normal capitalize">{v}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* FIX: mother name required, capitalize */}
        <FieldLabel en="Mother's Name" fil="Pangalan ng Ina" required />
        <Input
          className={`h-9 text-sm capitalize ${errMother ? "border-red-400 focus-visible:ring-red-300" : ""}`}
          placeholder="Mother's full name"
          value={form.motherName}
          onChange={(e) => set("motherName", e.target.value)}
          required
        />
      </div>
    </div>
  );
}

function StepEducation({ form }) {
  return (
    <div className="space-y-4">
      <InfoBanner message="Educational attainment is from the resident record." />
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-3">
          Educational Attainment <span className="italic">(Pang-edukasyong katayuan)</span>
        </p>
        <SelectionBadge options={EDUCATION_OPTIONS} value={form.education} />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        {EDUCATION_OPTIONS.map((opt) => (
          <div
            key={opt.value}
            className={`flex items-start gap-2 p-2.5 rounded-md border text-xs
              ${form.education === opt.value
                ? "border-foreground bg-foreground/5"
                : "border-border/40 text-muted-foreground"}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0
              ${form.education === opt.value ? "bg-foreground" : "bg-border"}`} />
            <div>
              <p className={`text-xs leading-tight
                ${form.education === opt.value ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                {opt.en}
              </p>
              {opt.fil && <p className="text-[9px] text-muted-foreground italic">{opt.fil}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepEmployment({ form }) {
  return (
    <div className="space-y-4">
      <InfoBanner message="Employment status is from the resident record." />
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-3">
          Employment Status <span className="italic">(Katayuan sa Pagtatrabaho)</span>
        </p>
        <SelectionBadge options={EMPLOYMENT_OPTIONS} value={form.employmentStatus} />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        {EMPLOYMENT_OPTIONS.map((opt) => (
          <div
            key={opt.value}
            className={`flex items-start gap-2 p-2.5 rounded-md border text-xs
              ${form.employmentStatus === opt.value
                ? "border-foreground bg-foreground/5"
                : "border-border/40 text-muted-foreground"}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0
              ${form.employmentStatus === opt.value ? "bg-foreground" : "bg-border"}`} />
            <div>
              <p className={`text-xs leading-tight
                ${form.employmentStatus === opt.value ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                {opt.en}
              </p>
              <p className="text-[9px] text-muted-foreground italic">{opt.fil}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepPhilHealth({ form, set }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {/* FIX: PhilHealth member status required */}
        <Label className="text-xs font-medium">
          PhilHealth Member?<Req />
        </Label>
        <RadioGroup value={form.philHealthMember} onValueChange={(v) => set("philHealthMember", v)} className="flex gap-4">
          {["yes", "no"].map((v) => (
            <div key={v} className="flex items-center gap-1.5">
              <RadioGroupItem value={v} id={`phil-${v}`} />
              <Label htmlFor={`phil-${v}`} className="cursor-pointer text-xs font-normal capitalize">{v}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {form.philHealthMember === "yes" && (
        <div className="pl-3 border-l-2 border-border space-y-3 pt-1">
          <div className="space-y-1.5">
            {/* FIX: status type required */}
            <FieldLabel en="Status Type" required />
            <RadioGroup value={form.philHealthStatus} onValueChange={(v) => set("philHealthStatus", v)} className="flex gap-4">
              {["member", "dependent"].map((v) => (
                <div key={v} className="flex items-center gap-1.5">
                  <RadioGroupItem value={v} id={`ph-status-${v}`} />
                  <Label htmlFor={`ph-status-${v}`} className="cursor-pointer text-xs font-normal capitalize">{v}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-1.5">
            {/* FIX: PhilHealth No. required */}
            <FieldLabel en="PhilHealth No." required />
            <Input
              className="h-9 text-sm"
              placeholder="PhilHealth number"
              value={form.philHealthNo}
              onChange={(e) => set("philHealthNo", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            {/* FIX: employment type required */}
            <FieldLabel en="Employment Type" required />
            <div className="grid grid-cols-2 gap-2">
              {EMP_TYPES.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`emp-${opt.value}`}
                    checked={form.employmentType === opt.value}
                    onCheckedChange={() =>
                      set("employmentType", form.employmentType === opt.value ? "" : opt.value)
                    }
                  />
                  <Label htmlFor={`emp-${opt.value}`} className="cursor-pointer text-xs font-normal">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepFamily({ form, set }) {
  return (
    <div className="space-y-3">
      {/* FIX: family position required */}
      <p className="text-[11px] font-medium text-muted-foreground">
        Family Position <span className="italic">(Posisyon sa Pamilya)</span><Req />
      </p>
      <div className="grid grid-cols-2 gap-2">
        {FAMILY_OPTIONS.map((opt) => {
          const checked = form.familyPosition === opt.value;
          return (
            <div
              key={opt.value}
              role="checkbox" aria-checked={checked} tabIndex={0}
              onClick={() => set("familyPosition", checked ? "" : opt.value)}
              onKeyDown={(e) => e.key === " " && set("familyPosition", checked ? "" : opt.value)}
              className={`flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-all
                ${checked ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/30"}`}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => set("familyPosition", checked ? "" : opt.value)}
                className="mt-0.5" tabIndex={-1}
              />
              <div>
                <p className="text-xs font-medium leading-tight">{opt.en}</p>
                <p className="text-[10px] text-muted-foreground italic">{opt.fil}</p>
              </div>
            </div>
          );
        })}
      </div>

      {form.familyPosition === "others" && (
        // FIX: capitalize + required when "Others" selected
        <Input
          className="h-9 text-sm capitalize"
          placeholder="Please specify…"
          value={form.familyOther}
          onChange={(e) => set("familyOther", e.target.value)}
          required
        />
      )}

      <div className="space-y-1.5">
        {/* FIX: Family No. required */}
        <FieldLabel en="Family No." fil="Blg. ng Pamilya" required />
        <Input
          className="h-9 text-sm"
          placeholder="e.g. F-000001"
          value={form.familyNo}
          onChange={(e) => set("familyNo", e.target.value)}
          required
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        {/* FIX: PCB member required */}
        <Label className="text-xs font-medium">
          Primary Care Benefit{" "}
          <span className="font-normal text-muted-foreground">(PCB)</span> Member?<Req />
        </Label>
        <RadioGroup value={form.pcbMember} onValueChange={(v) => set("pcbMember", v)} className="flex gap-4">
          {["yes", "no"].map((v) => (
            <div key={v} className="flex items-center gap-1.5">
              <RadioGroupItem value={v} id={`pcb-${v}`} />
              <Label htmlFor={`pcb-${v}`} className="cursor-pointer text-xs font-normal capitalize">{v}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function PatientFormPage() {
  const { id }            = useParams();
  const navigate          = useNavigate();
  const [searchParams]    = useSearchParams();

  const isEditing = searchParams.get("mode") === "edit";

  const [form,           setForm]           = useState(INITIAL_FORM);
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState("");
  const [submitStatus,   setSubmitStatus]   = useState(null);
  const [submitError,    setSubmitError]    = useState("");
  const [activeStep,     setActiveStep]     = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [validationErrors, setValidationErrors] = useState([]);

  const isLastStep = activeStep === STEPS.length - 1;

  /* ── Fetch record on mount ── */
  useEffect(() => {
    if (!id) {
      setLoadError("No record ID provided in the URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (isEditing) {
          const data = await getHealthRecordById(id);
          if (!cancelled) setForm(normalizeFromHealthRecord(data));
        } else {
          const data = await getResidentDatabyId(id);
          if (!cancelled) setForm(normalizeFromResident(data));
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err?.response?.data?.message ??
            err?.message ??
            "Failed to load record."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, isEditing]);

  const set = useCallback(
    (field, val) => setForm((prev) => ({ ...prev, [field]: val })),
    []
  );

  const bmi = useMemo(() => calcBmi(form.weight, form.height), [form.weight, form.height]);

  /* ── Build payload ── */
  const buildPayload = useCallback(() => {
    const payload = {
      weight: parseFloat(form.weight) || null,
      height: parseFloat(form.height) || null,
      bmi:    bmi?.raw ?? null,
      details: {
        civilStatus:      form.civilStatus,
        education:        form.education,
        employmentStatus: form.employmentStatus,
        birthPlace:       form.birthPlace,
        bloodType:        form.bloodType,
        motherName:       form.motherName,
        spouseName:       form.spouseName,
        fourPs:           form.fourPs,
        philHealth: {
          member:         form.philHealthMember,
          status:         form.philHealthStatus,
          no:             form.philHealthNo,
          employmentType: form.employmentType,
        },
        familyPosition:  form.familyPosition,
        familyOther:     form.familyOther,
        employmentOther: form.employmentOther,
        pcbMember:       form.pcbMember,
        familyNo:        form.familyNo,
      },
    };

    if (!isEditing) {
      payload.resident_id = form._residentId || id;
    }

    return payload;
  }, [form, bmi, id, isEditing]);

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    setSubmitStatus("loading");
    setSubmitError("");

    const confirmed = await showWarningAlert({
      title: isEditing ? "Confirm update" : "Confirm submission",
      text: isEditing ? "Are you sure you want to update this health record?" : "Are you sure you want to submit this health record?"
    });

    if (!confirmed) {
      setSubmitStatus("idle");
      return;
    }

    try {
      const payload = buildPayload();

      if (isEditing) {
        await updateHealthRecord(id, payload);
        toastSuccess("Health record updated successfully.","The health record has been updated.");
      } else {
        await createHealthRecord(payload);
        toastSuccess("Health record submitted successfully.","The health record has been submitted.");
      }

    
      setSubmitStatus("success");
      // FIX: mark last step as completed on successful submit
      setCompletedSteps((s) => new Set([...s, activeStep]));

      navigate(`/health-records`);
    } catch (err) {
   const message =
  err?.response?.data?.message ||   // if backend uses "message"
  err?.response?.data?.error ||     // 👈 your backend uses this
  err?.message ||
  "Submission failed. Please try again.";
      setSubmitError(message);
      setSubmitStatus("error");
      toastError("Submission failed", message);
    }
  }, [buildPayload, id, isEditing, activeStep]);

  /* ── Navigation ── */
  const goToStep = (idx) => {
    setValidationErrors([]);
    setActiveStep(idx);
  };

  const handleNext = () => {
    const errors = validateStep(activeStep, form);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return; // block navigation
    }
    setValidationErrors([]);
    setCompletedSteps((s) => new Set([...s, activeStep]));
    if (isLastStep) {
      handleSubmit();
    } else {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setValidationErrors([]);
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  /* ── Panel renderer ── */
  const renderPanel = () => {
    const props = { form, set, bmi, validationErrors };
    switch (activeStep) {
      case 0: return <StepName       {...props} />;
      case 1: return <StepBasic      {...props} />;
      case 2: return <StepCivil      {...props} />;
      case 3: return <StepEducation  {...props} />;
      case 4: return <StepEmployment {...props} />;
      case 5: return <StepPhilHealth {...props} />;
      case 6: return <StepFamily     {...props} />;
      default: return null;
    }
  };

  const StepIcon     = STEPS[activeStep].icon;
  // FIX: capitalize resident name displayed in header
  const residentName = [form.firstName, form.lastName].filter(Boolean).join(" ");

  /* ── Loading state ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading patient record…</p>
      </div>
    </div>
  );

  /* ── Error state ── */
  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-sm font-medium text-red-600">{loadError}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    </div>
  );

  /* ── Page ── */
  return (
    <div className="min-h-screen flex flex-col bg-background">


      {/* Main */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="flex gap-6 items-start">

          {/* Sidebar */}
          <div className="hidden lg:block sticky top-[61px]">
            <StepSidebar
              activeStep={activeStep}
              completedSteps={completedSteps}
              onGoToStep={goToStep}
              residentName={residentName}
              recordId={id}
              isEditing={isEditing}
            />
          </div>

          {/* Form panel */}
          <div className="flex-1 min-w-0">
            <div className="border border-border rounded-2xl shadow-sm overflow-hidden">

              {/* Step header */}
              <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border shrink-0">
                  <StepIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{STEPS[activeStep].label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{STEPS[activeStep].sub}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                    ${isEditing
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : "bg-green-50 text-green-600 border border-green-100"}`}>
                    {isEditing ? "Editing" : "New"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Step {activeStep + 1} of {STEPS.length}
                  </span>
                </div>
              </div>

              {/* Mobile step indicators */}
              <div className="lg:hidden px-5 py-3 border-b border-border">
                <div className="flex items-center gap-1">
                  {STEPS.map((s, i) => {
                    const Icon   = s.icon;
                    // FIX: consistent done logic on mobile too
                    const done   = completedSteps.has(i) || i < activeStep;
                    const active = i === activeStep;
                    return (
                      <div key={i} className="flex items-center flex-1">
                        <button
                          onClick={() => goToStep(i)}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0 transition-all
                            ${done   ? "border-foreground/70 bg-foreground/70 text-background"
                              : active ? "border-foreground text-foreground"
                              : "border-border text-muted-foreground"}`}
                        >
                          {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                        </button>
                        {i < STEPS.length - 1 && (
                          <div className={`flex-1 h-px mx-1 ${done ? "bg-foreground/30" : "bg-border"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6 min-h-[360px] max-h-[calc(100vh-320px)] overflow-y-auto">
                {renderPanel()}

                <ValidationBanner errors={validationErrors} />

                {isLastStep && submitStatus === "success" && (
                  <StatusBanner
                    type="success"
                    message={isEditing ? "Record updated successfully!" : "Record created successfully!"}
                  />
                )}
                {isLastStep && submitStatus === "error" && (
                  <StatusBanner type="error" message={submitError || "Submission failed. Please try again."} />
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-4">
                {activeStep === 0 ? (
                  <div />
                ) : (
                  <Button variant="outline" size="sm" onClick={handlePrev} className="gap-1.5 h-9 text-xs">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={submitStatus === "loading"}
                  className="gap-1.5 h-9 text-xs min-w-[130px] justify-center"
                >
                  {submitStatus === "loading" ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                  ) : isLastStep ? (
                    <><Check className="w-3.5 h-3.5" /> {isEditing ? "Update Record" : "Create Record"}</>
                  ) : (
                    <>Continue <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </Button>
              </div>
            </div>

            {/* FIX: legend for required fields */}
            <p className="text-center text-[10px] text-muted-foreground mt-4">
              Fields marked with <span className="text-red-500 font-semibold">*</span> are required.
              All information provided is kept confidential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}