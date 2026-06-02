import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

import {
  User, ClipboardList, Pill, Baby, CalendarDays, Hospital, Flower2,
  CheckCircle2, Circle, AlertTriangle, RotateCcw, Save,
  Loader2, X, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight, FileHeart,
  Lock, CalendarClock,
} from "lucide-react";

import { toastSuccess, toastError } from "@/utils/toast";
import { showWarningAlert } from "@/utils/dialog";
import { getHealthRecordById } from "@/api/health";
import { createPrenatalRecord, updatePrenatalRecord, getPrenatalRecordById } from "@/api/pregant";

/* ─── Constants ─────────────────────────────────────────────────── */
const CHECKLIST_ITEMS = [
  ["nausea", "Nausea"], ["dizziness", "Dizziness"], ["constipation", "Constipation"],
  ["cramps", "Cramps"], ["pruritus", "Pruritus"], ["leukorrhea", "Leukorrhea"],
  ["headache", "Headache"], ["bleeding", "Bleeding"], ["edema", "Edema"],
  ["vomiting", "Vomiting"], ["blurring", "Blurring of Vision"],
];

const RISK_CODES = [
  ["A", "Age less than 18 or greater than 35"],
  ["B", "Being less than 145 cm (4'9\") tall"],
  ["C", "Having a fourth (or more) baby (grand multi)"],
  ["D", "Previous caesarian section, 3 consecutive miscarriages, or postpartum"],
  ["E", "Medical conditions: TB, Heart Disease, Diabetes, Bronchial Asthma, Goiter"],
];

const VISIT_FIELDS = [
  ["date", "Date"], ["weight", "Weight / BP"], ["iron", "Iron / VA"],
  ["aog", "AOG / Pres / FH / FHB"], ["tt", "TT Status"],
  ["urinalysis", "Urinalysis"], ["remarks", "Remarks"],
];

const PP_FIELDS = [
  ["date", "Date"], ["bp", "Vital Signs"], ["fh", "FH"],
  ["b", "B"], ["bo", "Bo"], ["mix", "Mix"],
  ["vaginal", "Vaginal Discharge"], ["iron", "Iron / VA"],
  ["observation", "Observation"], ["remarks", "Remarks"],
];

const STEPS = [
  { id: "patient",    label: "Patient",     sub: "Demographics",     icon: User },
  { id: "history",    label: "History",     sub: "Past pregnancies", icon: ClipboardList },
  { id: "planning",   label: "Planning",    sub: "Family planning",  icon: Pill },
  { id: "pregnancy",  label: "Pregnancy",   sub: "Current status",   icon: Baby },
  { id: "visits",     label: "Visits",      sub: "Check-up records", icon: CalendarDays },
  { id: "delivery",   label: "Delivery",    sub: "Birth details",    icon: Hospital },
  { id: "postpartum", label: "Post-Partum", sub: "Follow-up visits", icon: Flower2 },
];

const NAV_TARGET = "/pregnant-records";

/* ─── Helpers ────────────────────────────────────────────────────── */
function buildFullName(resident) {
  if (!resident) return "";
  const { f_name, m_name, l_name, s_name } = resident;
  return [l_name, f_name, m_name, s_name].filter(Boolean).join(" ");
}

function toInputDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

/** Naegele's Rule: LMP + 9 months + 7 days */
function calcEDD(lmpStr) {
  if (!lmpStr) return "";
  const lmp = new Date(lmpStr);
  if (isNaN(lmp)) return "";
  const edd = new Date(lmp);
  edd.setMonth(edd.getMonth() + 9);
  edd.setDate(edd.getDate() + 7);
  return edd.toISOString().split("T")[0];
}

function buildApiPayload(form, healthRecord, healthRecordId) {
  const age = healthRecord?.resident?.age ?? null;

  const pregnancy_start_date   = form.lastMenstruation   || null;
  const expected_delivery_date = form.expectedConfinement || null;

  let current_trimester = null;
  if (form.lastMenstruation) {
    const w = Math.floor(
      (new Date() - new Date(form.lastMenstruation)) / (1000 * 60 * 60 * 24 * 7)
    );
    current_trimester = w <= 12 ? 1 : w <= 26 ? 2 : 3;
  }

  const allDates = [
    ...form.visits["1st"],
    ...form.visits["2nd"],
    ...form.visits["3rd"],
  ]
    .map(v => v.date)
    .filter(Boolean)
    .sort()
    .reverse();
  const last_checkup = allDates[0] || null;

  const details = {
    patientInfo: {
      age,
      husbandName:       form.husbandName,
      husbandOccupation: form.husbandOccupation,
      address:           form.address,
    },
    preNatalHistory: {
      childrenAlive:  form.childrenAlive,
      livingChildren: form.livingChildren,
      abortions:      form.abortions,
      stillBirths:    form.stillBirths,
      complications: {
        hemorrhage:     form.hemorrhage,
        toxemia:        form.toxemia,
        placentaPrevia: form.placentaPrevia,
        sepsis:         form.sepsis,
        other:          form.otherComplication,
      },
    },
    familyPlanning: {
      practiced:            form.familyPlanningPracticed,
      method:               form.familyPlanningMethod,
      willingToPractice:    form.willingToPractice,
      familyHistoryYes:     form.familyHistoryYes,
      familyHistorySpecify: form.familyHistorySpecify,
    },
    presentPregnancy: {
      gravida:             form.gravidaChecked ? (form.gravida || true) : null,
      para:                form.paraChecked    ? (form.para    || true) : null,
      lastMenstruation:    form.lastMenstruation,
      expectedConfinement: form.expectedConfinement,
      specialCases:        form.specialCases,
      checklist:           form.checklist,
    },
    visits: {
      "1st": form.visits["1st"],
      "2nd": form.visits["2nd"],
      "3rd": form.visits["3rd"],
    },
    risk: { code: form.riskCode, date: form.riskDate },
    delivery: {
      date:             form.deliveryDate,
      childName:        form.childName,
      sex:              form.sex,
      weight:           form.weight,
      place:            form.place,
      attendedBy:       form.attendedBy,
      deliveryType:     form.deliveryType,
      abnormalSpec:     form.abnormalSpec,
      abnormality:      form.abnormality,
      newBornScreening: form.newBornScreening,
    },
    postPartum: form.postPartum,
  };

  return {
    health_record_id:     healthRecordId ?? null,
    pregnancy_start_date,
    expected_delivery_date,
    current_trimester,
    last_checkup,
    details: JSON.stringify(details),
  };
}

async function saveRecord(form, recordId, healthRecord, healthRecordId) {
  const payload = buildApiPayload(form, healthRecord, healthRecordId);
  if (recordId) {
    return updatePrenatalRecord(recordId, payload);
  }
  return createPrenatalRecord(payload);
}

const initVisit = () => ({ date: "", weight: "", iron: "", aog: "", tt: "", urinalysis: "", remarks: "" });
const initPP    = () => ({ date: "", bp: "", fh: "", b: false, bo: false, mix: false, vaginal: "", iron: "", observation: "", remarks: "" });

const blankForm = () => ({
  familyNumber: "", name: "", dateOfBirth: "", age: "",
  husbandName: "", husbandOccupation: "", address: "",
  childrenAlive: "", livingChildren: "", abortions: "", stillBirths: "",
  hemorrhage: "", toxemia: "", placentaPrevia: "", sepsis: "", otherComplication: "",
  familyPlanningPracticed: "", familyPlanningMethod: "", willingToPractice: "",
  familyHistoryYes: "", familyHistorySpecify: "",
  gravidaChecked: false, gravida: "", paraChecked: false, para: "",
  lastMenstruation: "", expectedConfinement: "", specialCases: "",
  _eddManual: false,
  checklist: {
    nausea: false, dizziness: false, constipation: false, cramps: false, pruritus: false,
    leukorrhea: false, headache: false, bleeding: false, edema: false, vomiting: false, blurring: false,
  },
  riskCode: "", riskDate: "",
  deliveryDate: "", childName: "", sex: "", weight: "", place: "", attendedBy: "",
  deliveryType: "Normal", abnormalSpec: "", abnormality: "", newBornScreening: "",
  visits: {
    "1st": Array(4).fill(null).map(initVisit),
    "2nd": Array(4).fill(null).map(initVisit),
    "3rd": Array(4).fill(null).map(initVisit),
  },
  postPartum: Array(4).fill(null).map(initPP),
});

/* ─── Map API response → form state ─────────────────────────────── */
function mapRecordToForm(data) {
  const d  = data.details ?? {};
  const pi = d.patientInfo      ?? {};
  const ph = d.preNatalHistory  ?? {};
  const co = ph.complications   ?? {};
  const fp = d.familyPlanning   ?? {};
  const pp = d.presentPregnancy ?? {};
  const vi = d.visits           ?? {};
  const ri = d.risk             ?? {};
  const dl = d.delivery         ?? {};
  const pt = d.postPartum       ?? [];

  return {
    husbandName:       pi.husbandName       ?? "",
    husbandOccupation: pi.husbandOccupation ?? "",
    address:           pi.address           ?? "",
    childrenAlive:     ph.childrenAlive  ?? "",
    livingChildren:    ph.livingChildren ?? "",
    abortions:         ph.abortions      ?? "",
    stillBirths:       ph.stillBirths    ?? "",
    hemorrhage:        co.hemorrhage     ?? "",
    toxemia:           co.toxemia        ?? "",
    placentaPrevia:    co.placentaPrevia ?? "",
    sepsis:            co.sepsis         ?? "",
    otherComplication: co.other          ?? "",
    familyPlanningPracticed: fp.practiced            ?? "",
    familyPlanningMethod:    fp.method               ?? "",
    willingToPractice:       fp.willingToPractice    ?? "",
    familyHistoryYes:        fp.familyHistoryYes     ?? "",
    familyHistorySpecify:    fp.familyHistorySpecify ?? "",
    gravidaChecked:      pp.gravida != null,
    gravida:             pp.gravida != null ? String(pp.gravida) : "",
    paraChecked:         pp.para    != null,
    para:                pp.para    != null ? String(pp.para)    : "",
    lastMenstruation:    pp.lastMenstruation    ?? "",
    expectedConfinement: pp.expectedConfinement ?? "",
    specialCases:        pp.specialCases        ?? "",
    _eddManual:          false,
    checklist: {
      nausea:       pp.checklist?.nausea       ?? false,
      dizziness:    pp.checklist?.dizziness    ?? false,
      constipation: pp.checklist?.constipation ?? false,
      cramps:       pp.checklist?.cramps       ?? false,
      pruritus:     pp.checklist?.pruritus     ?? false,
      leukorrhea:   pp.checklist?.leukorrhea   ?? false,
      headache:     pp.checklist?.headache     ?? false,
      bleeding:     pp.checklist?.bleeding     ?? false,
      edema:        pp.checklist?.edema        ?? false,
      vomiting:     pp.checklist?.vomiting     ?? false,
      blurring:     pp.checklist?.blurring     ?? false,
    },
    riskCode: ri.code ?? "",
    riskDate: ri.date ?? "",
    visits: {
      "1st": vi["1st"]?.length ? vi["1st"] : Array(4).fill(null).map(initVisit),
      "2nd": vi["2nd"]?.length ? vi["2nd"] : Array(4).fill(null).map(initVisit),
      "3rd": vi["3rd"]?.length ? vi["3rd"] : Array(4).fill(null).map(initVisit),
    },
    deliveryDate:     dl.date             ?? "",
    childName:        dl.childName        ?? "",
    sex:              dl.sex              ?? "",
    weight:           dl.weight           ?? "",
    place:            dl.place            ?? "",
    attendedBy:       dl.attendedBy       ?? "",
    deliveryType:     dl.deliveryType     ?? "Normal",
    abnormalSpec:     dl.abnormalSpec     ?? "",
    abnormality:      dl.abnormality      ?? "",
    newBornScreening: dl.newBornScreening ?? "",
    postPartum: pt.length ? pt : Array(4).fill(null).map(initPP),
    familyNumber: "", name: "", dateOfBirth: "", age: "",
  };
}

/* ─── Reusable primitives ────────────────────────────────────────── */
const FieldGroup = ({ label, children, className = "", required }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const PnInput = ({ value, onChange, name, placeholder = "", type = "text", disabled = false, className = "" }) => (
  <Input
    type={type} name={name} value={value} onChange={onChange}
    placeholder={placeholder} disabled={disabled}
    className={`h-10 text-sm border-border rounded-lg focus:border-ring focus:ring-0 placeholder:text-muted-foreground/40 disabled:opacity-40 disabled:bg-muted ${className}`}
  />
);

const LockedField = ({ label, value, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
      {label}
      <Lock size={10} className="text-muted-foreground" />
    </label>
    <div className="h-10 flex items-center px-3 rounded-lg border border-dashed border-border bg-muted/40 text-sm text-foreground select-none">
      {value || <span className="text-muted-foreground/40 text-xs italic">—</span>}
    </div>
  </div>
);

const PillRadio = ({ name, value, onChange, options = ["YES", "NO"] }) => (
  <div className="flex gap-2 flex-wrap">
    {options.map(opt => (
      <button key={opt} type="button" onClick={() => onChange(name, opt)}
        className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all
          ${value === opt
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:border-ring hover:text-foreground"}`}>
        {opt}
      </button>
    ))}
  </div>
);

const ScrollHint = () => (
  <p className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
    <ChevronRight size={10} />
    Scroll horizontally to see all columns
  </p>
);

/* ─── Toast ──────────────────────────────────────────────────────── */
const Toast = ({ toast }) => {
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl bg-card
      ${ok ? "border-border text-card-foreground" : "border-destructive/30 text-destructive"}`}>
      {ok
        ? <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
        : <X size={15} className="text-destructive flex-shrink-0" />}
      {toast.message}
    </div>
  );
};

/* ─── Step panels ────────────────────────────────────────────────── */
function StepPatient({ form, handle, healthRecord }) {
  const resident = healthRecord?.resident;
  const details  = healthRecord?.details;
  const fullName = buildFullName(resident);
  const dob      = toInputDate(resident?.b_date);
  const familyNo = details?.familyNo || "";
  const age      = resident?.age != null ? String(resident.age) : "";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Patient Information</h2>
        <p className="text-sm text-muted-foreground mt-1">Basic demographic and identification details.</p>
      </div>

      {healthRecord && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-4 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Lock size={10} />
            From Health Record — read only
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <LockedField label="Family Number" value={familyNo} />
            <LockedField label="Date of Birth"  value={dob} />
            <LockedField label="Age"             value={age ? `${age} yrs` : ""} />
          </div>
          <LockedField label="Full Name" value={fullName} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Husband's Name">
          <PnInput name="husbandName" value={form.husbandName} onChange={handle} placeholder="Last, First Middle" />
        </FieldGroup>
        <FieldGroup label="Husband's Occupation">
          <PnInput name="husbandOccupation" value={form.husbandOccupation} onChange={handle} placeholder="Occupation" />
        </FieldGroup>
      </div>
      <FieldGroup label="Home Address">
        <PnInput name="address" value={form.address} onChange={handle} placeholder="Street, Barangay, City/Municipality, Province" />
      </FieldGroup>
    </div>
  );
}

function StepHistory({ form, handle, handleRadio }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Pre-Natal History</h2>
        <p className="text-sm text-muted-foreground mt-1">Previous pregnancies and complications.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Obstetric Score</p>
          {[
            ["childrenAlive",  "Children born alive"],
            ["livingChildren", "Currently living children"],
            ["abortions",      "Number of abortions"],
            ["stillBirths",    "Still births / Fetal deaths"],
          ].map(([n, l]) => (
            <FieldGroup key={n} label={l}>
              <PnInput name={n} value={form[n]} onChange={handle} placeholder="0" />
            </FieldGroup>
          ))}
        </div>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Previous Complications</p>
          {[
            ["Hemorrhage",      "hemorrhage"],
            ["Toxemia",         "toxemia"],
            ["Placenta Previa", "placentaPrevia"],
            ["Sepsis",          "sepsis"],
          ].map(([l, k]) => (
            <div key={k} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{l}</span>
              <PillRadio name={k} value={form[k]} onChange={handleRadio} />
            </div>
          ))}
          <FieldGroup label="Other — specify">
            <PnInput name="otherComplication" value={form.otherComplication} onChange={handle} placeholder="Describe other complications" />
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}

function StepPlanning({ form, handle, handleRadio }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Family Planning</h2>
        <p className="text-sm text-muted-foreground mt-1">Contraception history and preferences.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Has family planning been practiced?</label>
            <PillRadio name="familyPlanningPracticed" value={form.familyPlanningPracticed} onChange={handleRadio} />
          </div>
          <FieldGroup label="Method used">
            <PnInput name="familyPlanningMethod" value={form.familyPlanningMethod} onChange={handle} placeholder="e.g. Pills, IUD, Condom..." />
          </FieldGroup>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Willing to practice family planning?</label>
            <PillRadio name="willingToPractice" value={form.willingToPractice} onChange={handleRadio} />
          </div>
        </div>
        <div className="space-y-4">
          <FieldGroup label="Family History — specify">
            <PnInput name="familyHistoryYes" value={form.familyHistoryYes} onChange={handle} placeholder="Any hereditary conditions" />
          </FieldGroup>
          <FieldGroup label="Additional details">
            <PnInput name="familyHistorySpecify" value={form.familyHistorySpecify} onChange={handle} placeholder="Further information" />
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}

function StepPregnancy({ form, handle, set, setForm, handleRadio, handleCheck }) {
  const autoEDD   = calcEDD(form.lastMenstruation);
  const isAutoEDD = !!form.lastMenstruation && form.expectedConfinement === autoEDD;

  const handleLMP = (e) => {
    const lmp = e.target.value;
    const edd = calcEDD(lmp);
    setForm(f => ({
      ...f,
      lastMenstruation:    lmp,
      expectedConfinement: f._eddManual ? f.expectedConfinement : edd,
    }));
  };

  const handleEDD = (e) => {
    const val = e.target.value;
    setForm(f => ({
      ...f,
      expectedConfinement: val,
      _eddManual: val !== calcEDD(f.lastMenstruation),
    }));
  };

  const resetEDD = () => {
    setForm(f => ({
      ...f,
      expectedConfinement: calcEDD(f.lastMenstruation),
      _eddManual: false,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Present Pregnancy</h2>
        <p className="text-sm text-muted-foreground mt-1">Current pregnancy details and symptom checklist.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FieldGroup label="Gravida">
          <div className="flex items-center gap-2 h-10 border border-border rounded-lg px-3 bg-background">
            <input type="checkbox" id="chk-gravida" checked={form.gravidaChecked}
              onChange={e => set("gravidaChecked", e.target.checked)}
              className="w-3.5 h-3.5 cursor-pointer rounded accent-primary" />
            <label htmlFor="chk-gravida" className="text-xs cursor-pointer text-muted-foreground font-medium">Gravida</label>
            <input name="gravida" value={form.gravida} onChange={handle} placeholder="#"
              disabled={!form.gravidaChecked}
              className="w-8 text-sm border-none bg-transparent outline-none text-foreground disabled:opacity-40" />
          </div>
        </FieldGroup>

        <FieldGroup label="Para">
          <div className="flex items-center gap-2 h-10 border border-border rounded-lg px-3 bg-background">
            <input type="checkbox" id="chk-para" checked={form.paraChecked}
              onChange={e => set("paraChecked", e.target.checked)}
              className="w-3.5 h-3.5 cursor-pointer rounded accent-primary" />
            <label htmlFor="chk-para" className="text-xs cursor-pointer text-muted-foreground font-medium">Para</label>
            <input name="para" value={form.para} onChange={handle} placeholder="#"
              disabled={!form.paraChecked}
              className="w-8 text-sm border-none bg-transparent outline-none text-foreground disabled:opacity-40" />
          </div>
        </FieldGroup>

        <FieldGroup label="Last Menstruation" required>
          <PnInput
            name="lastMenstruation"
            value={form.lastMenstruation}
            onChange={handleLMP}
            type="date"
            className={!form.lastMenstruation ? "border-red-400 dark:border-red-500" : ""}
          />
          {!form.lastMenstruation && (
            <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle size={9} /> Required to continue
            </p>
          )}
        </FieldGroup>

        <FieldGroup label="Expected Confinement">
          <div className="relative">
            <PnInput
              name="expectedConfinement"
              value={form.expectedConfinement}
              onChange={handleEDD}
              type="date"
              className={isAutoEDD ? "pr-8 border-primary/40" : ""}
            />
            {isAutoEDD && (
              <CalendarClock size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary/60 pointer-events-none" />
            )}
          </div>
          {form.lastMenstruation && (
            <div className="mt-1 flex items-center justify-between">
              {isAutoEDD ? (
                <p className="text-[10px] text-primary flex items-center gap-1">
                  <CalendarClock size={9} /> Auto-calculated · editable
                </p>
              ) : form.expectedConfinement ? (
                <p className="text-[10px] text-muted-foreground">Manually set</p>
              ) : null}
              {form._eddManual && form.lastMenstruation && (
                <button type="button" onClick={resetEDD} className="text-[10px] text-primary hover:underline">
                  ↺ Reset to auto
                </button>
              )}
            </div>
          )}
        </FieldGroup>
      </div>

      {form.lastMenstruation && (
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <CalendarClock size={14} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-primary/80 leading-relaxed">
            <span className="font-semibold">Expected Due Date</span> is auto-calculated via Naegele's Rule
            (LMP + 9 months + 7 days). You can override it manually anytime.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Special Cases</label>
        <PillRadio name="specialCases" value={form.specialCases} onChange={handleRadio} />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Symptom Checklist
          <span className="font-normal text-muted-foreground ml-2 text-xs">— select all that apply</span>
        </label>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
          {CHECKLIST_ITEMS.map(([key, label]) => (
            <div key={key} onClick={() => handleCheck(key, !form.checklist[key])}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-xs font-medium select-none
                ${form.checklist[key]
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-ring hover:text-foreground"}`}>
              {form.checklist[key]
                ? <CheckCircle2 size={13} className="flex-shrink-0" />
                : <Circle size={13} className="opacity-40 flex-shrink-0" />}
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepVisits({ form, handle, updateVisit, activeTrimester, setActiveTrimester }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Pre-Natal Visits</h2>
        <p className="text-sm text-muted-foreground mt-1">Scheduled check-up records by trimester.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {["1st", "2nd", "3rd"].map(tr => (
          <button key={tr} onClick={() => setActiveTrimester(tr)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer
              ${activeTrimester === tr
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-ring"}`}>
            {tr} Trimester
          </button>
        ))}
      </div>
      <ScrollHint />
      <div className="w-full overflow-x-auto rounded-xl border border-border" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full border-collapse text-xs min-w-[580px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {VISIT_FIELDS.map(([, h]) => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {form.visits[activeTrimester].map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {VISIT_FIELDS.map(([f]) => (
                  <td key={f} className="p-1">
                    <input type={f === "date" ? "date" : "text"} value={row[f]}
                      onChange={e => updateVisit(activeTrimester, i, f, e.target.value)}
                      className="w-full h-8 rounded-md border border-transparent bg-transparent px-2 text-xs text-foreground outline-none hover:border-border focus:border-ring transition-all min-w-[80px] placeholder:text-muted-foreground/40" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 flex-wrap pt-2">
        <FieldGroup label="Risk Code">
          <PnInput name="riskCode" value={form.riskCode} onChange={handle} placeholder="A–E" className="w-28" />
        </FieldGroup>
        <FieldGroup label="Date Risk Detected">
          <PnInput name="riskDate" value={form.riskDate} onChange={handle} type="date" />
        </FieldGroup>
      </div>
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={13} className="text-amber-500" />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Risk Code Reference</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {RISK_CODES.map(([code, desc]) => (
            <div key={code} className="flex gap-2.5 items-start">
              <div className="w-5 h-5 rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{code}</div>
              <span className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepDelivery({ form, handle, handleRadio }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Delivery</h2>
        <p className="text-sm text-muted-foreground mt-1">Birth details and newborn information.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          ["deliveryDate", "Delivery Date",    "date"],
          ["childName",    "Name of Child",     "text"],
          ["sex",          "Sex",               "text"],
          ["weight",       "Birth Weight (kg)", "text"],
          ["place",        "Place of Delivery", "text"],
          ["attendedBy",   "Attended By",       "text"],
        ].map(([n, l, t]) => (
          <FieldGroup key={n} label={l}>
            <PnInput name={n} value={form[n]} onChange={handle} type={t} placeholder={t === "date" ? "" : l} />
          </FieldGroup>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Type of Delivery</label>
        <PillRadio name="deliveryType" value={form.deliveryType} onChange={handleRadio} options={["Normal", "Abnormal"]} />
      </div>
      {form.deliveryType === "Abnormal" && (
        <FieldGroup label="Specify Abnormality">
          <PnInput name="abnormalSpec" value={form.abnormalSpec} onChange={handle} placeholder="Describe the abnormality" />
        </FieldGroup>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Abnormality">
          <PnInput name="abnormality" value={form.abnormality} onChange={handle} placeholder="If any" />
        </FieldGroup>
        <FieldGroup label="New Born Screening">
          <PnInput name="newBornScreening" value={form.newBornScreening} onChange={handle} placeholder="Date or result" />
        </FieldGroup>
      </div>
    </div>
  );
}

function StepPostPartum({ form, updatePP }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Post Partum Follow-Up</h2>
        <p className="text-sm text-muted-foreground mt-1">Postnatal monitoring visits.</p>
      </div>
      <ScrollHint />
      <div className="w-full overflow-x-auto rounded-xl border border-border" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full border-collapse text-xs min-w-[820px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {PP_FIELDS.map(([, h]) => (
                <th key={h} className="px-2 py-2.5 text-center text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {form.postPartum.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="p-1">
                  <input type="date" value={row.date} onChange={e => updatePP(i, "date", e.target.value)}
                    className="w-full h-8 rounded border border-transparent bg-transparent px-1 text-xs text-foreground outline-none hover:border-border focus:border-ring transition-all min-w-[110px]" />
                </td>
                <td className="p-1">
                  <input type="text" value={row.bp} onChange={e => updatePP(i, "bp", e.target.value)} placeholder="BP"
                    className="w-full h-8 rounded border border-transparent bg-transparent px-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none hover:border-border focus:border-ring transition-all min-w-[80px]" />
                </td>
                <td className="p-1">
                  <input type="text" value={row.fh} onChange={e => updatePP(i, "fh", e.target.value)} placeholder="FH"
                    className="w-full h-8 rounded border border-transparent bg-transparent px-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none hover:border-border focus:border-ring transition-all min-w-[60px]" />
                </td>
                {["b", "bo", "mix"].map(f => (
                  <td key={f} className="p-1 text-center">
                    <input type="checkbox" checked={row[f]} onChange={e => updatePP(i, f, e.target.checked)}
                      className="w-4 h-4 cursor-pointer rounded accent-primary" />
                  </td>
                ))}
                {["vaginal", "iron", "observation", "remarks"].map(f => (
                  <td key={f} className="p-1">
                    <input type="text" value={row[f]} onChange={e => updatePP(i, f, e.target.value)} placeholder="—"
                      className="w-full h-8 rounded border border-transparent bg-transparent px-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none hover:border-border focus:border-ring transition-all min-w-[80px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <span><strong className="text-foreground">B</strong> = Breastfeeding</span>
        <span><strong className="text-foreground">Bo</strong> = Bottle feeding</span>
        <span><strong className="text-foreground">Mix</strong> = Mixed feeding</span>
      </div>
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────────── */
function StepSidebar({ activeStep, completedSteps, totalSteps, isEditMode, recordId, form, healthRecord, prenatalRecord, onGoToStep, onReset }) {
  const progress = Math.round((completedSteps.size / totalSteps) * 100);

  const resident    = healthRecord?.resident;
  const displayName = buildFullName(resident) || prenatalRecord?.resident?.full_name || form.name || null;

  return (
    <aside className="flex flex-col border border-border rounded-2xl overflow-hidden shadow-sm bg-card">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileHeart className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Maternal Health</p>
            <p className="text-sm font-semibold leading-tight text-card-foreground">Pre-Natal Record</p>
          </div>
        </div>
        <div className="mt-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${isEditMode
              ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
              : "bg-muted text-muted-foreground"}`}>
            {isEditMode ? "Editing Record" : "New Record"}
          </span>
          {recordId && <span className="ml-2 text-[10px] text-muted-foreground">#{recordId}</span>}
        </div>
        {displayName && (
          <div className="mt-2 flex items-center gap-1.5">
            <User size={10} className="text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{displayName}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {STEPS.map((step, idx) => {
          const Icon       = step.icon;
          const isActive   = activeStep === idx;
          const isDone     = completedSteps.has(idx);
          const isUpcoming = idx > activeStep;
          return (
            <div key={step.id} className="relative">
              <button onClick={() => onGoToStep(idx)}
                className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all
                  ${isActive ? "bg-muted" : "hover:bg-muted/50"}
                  ${isUpcoming ? "opacity-40" : ""}`}>
                {idx < STEPS.length - 1 && (
                  <div className={`absolute left-[22px] top-[46px] w-0.5 h-[18px] transition-colors
                    ${isDone ? "bg-green-500/60" : "bg-border"}`} />
                )}
                <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all
                  ${isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isDone
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-border text-muted-foreground"}`}>
                  {isDone && !isActive ? <CheckCircle2 size={13} /> : <Icon size={12} />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-xs font-semibold leading-tight
                    ${isDone && !isActive ? "text-green-600 dark:text-green-400" : "text-card-foreground"}`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{step.sub}</p>
                </div>
                {isDone && !isActive && (
                  <span className="text-[9px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mt-1 shrink-0">
                    Done
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground">Progress</span>
          <span className="text-[11px] font-medium text-card-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {!isEditMode && (
          <button onClick={onReset}
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer py-1">
            <RotateCcw size={10} />
            Reset form
          </button>
        )}
      </div>
    </aside>
  );
}

/* ─── Main Page Component ────────────────────────────────────────── */
export default function PrenatalFormPage({
  recordId:       propRecordId       = null,
  initialForm:    propInitialForm    = null,
  healthRecordId: propHealthRecordId = null,
  onSaved,
  onBack,
}) {
  const params    = useParams();
  const location  = useLocation();
  const navigate  = useNavigate();             // ← added
  const navState  = location.state ?? {};

  /* ── Mode param: ?mode=add | ?mode=edit ── */
  const [searchParams]  = useSearchParams();
  const modeParam       = searchParams.get("mode"); // "add" | "edit" | null

  /**
   * ID resolution — driven by modeParam:
   *
   * ?mode=add  → params.id is the HEALTH RECORD id  (create a new prenatal record)
   * ?mode=edit → params.id is the PRENATAL RECORD id (edit an existing prenatal record)
   * no mode    → fall back to original prop/navState behaviour
   */
  const resolvedRecordId =
    modeParam === "edit"
      ? (params.id ?? navState.recordId ?? propRecordId)
      : modeParam === "add"
      ? null                              // never treat the UUID as a prenatal id in add mode
      : (navState.recordId ?? propRecordId ?? null);

  const resolvedHealthRecordId =
    modeParam === "add"
      ? params.id                         // UUID in path = health_record_id when adding
      : modeParam === "edit"
      ? null                              // will be read from prenatalRecord.health_record.id
      : (navState.healthRecordId ?? propHealthRecordId ?? null);

  const resolvedInitialForm = navState.initialForm ?? propInitialForm;

  /* ── Derive isEditMode cleanly from modeParam ── */
  const isEditMode =
    modeParam === "edit"
      ? true
      : modeParam === "add"
      ? false
      : !!resolvedRecordId;             // fallback: original behaviour

  /* ── State ── */
  const [form, setForm]                       = useState(() => resolvedInitialForm ?? blankForm());
  const [recordId, setRecordId]               = useState(resolvedRecordId);
  const [prenatalRecord, setPrenatalRecord]   = useState(null);
  const [saving, setSaving]                   = useState(false);
  const [toast, setToast]                     = useState(null);
  const [activeStep, setActiveStep]           = useState(0);
  const [activeTrimester, setActiveTrimester] = useState("1st");
  const [completedSteps, setCompletedSteps]   = useState(new Set());
  const [healthRecord, setHealthRecord]       = useState(null);
  const [healthLoading, setHealthLoading]     = useState(false);
  const [lmpError, setLmpError]               = useState(false);
  const contentRef = useRef(null);

  const totalSteps = STEPS.length;

  /* ─────────────────────────────────────────────────────────────────
   * EDIT MODE — load prenatal record then its linked health record
   * ───────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (modeParam !== "edit" || !resolvedRecordId) return;
    let cancelled = false;

    getPrenatalRecordById(resolvedRecordId)
      .then((data) => {
        if (cancelled) return;

        setPrenatalRecord(data);
        setForm(mapRecordToForm(data));

        const linkedHealthRecordId = data.health_record?.id;
        if (linkedHealthRecordId) {
          setHealthLoading(true);
          getHealthRecordById(linkedHealthRecordId)
            .then(hr  => { if (!cancelled) setHealthRecord(hr); })
            .catch(err => console.error("Failed to load linked health record:", err))
            .finally(() => { if (!cancelled) setHealthLoading(false); });
        }
      })
      .catch(err => console.error("Failed to load prenatal record:", err));

    return () => { cancelled = true; };
  }, [modeParam, resolvedRecordId]);

  /* ─────────────────────────────────────────────────────────────────
   * ADD MODE — load health record so locked fields are populated
   * ───────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (modeParam !== "add" || !resolvedHealthRecordId) return;
    let cancelled = false;

    setHealthLoading(true);
    getHealthRecordById(resolvedHealthRecordId)
      .then(data => { if (!cancelled) setHealthRecord(data); })
      .catch(err  => console.error("Failed to load health record:", err))
      .finally(() => { if (!cancelled) setHealthLoading(false); });

    return () => { cancelled = true; };
  }, [modeParam, resolvedHealthRecordId]);

  /* ─────────────────────────────────────────────────────────────────
   * FALLBACK (no modeParam) — original behaviour kept intact
   * ───────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (modeParam) return;

    if (resolvedRecordId) {
      let cancelled = false;

      getPrenatalRecordById(resolvedRecordId)
        .then((data) => {
          if (cancelled) return;
          setPrenatalRecord(data);
          setForm(mapRecordToForm(data));

          const linkedHealthRecordId = data.health_record?.id;
          if (linkedHealthRecordId) {
            setHealthLoading(true);
            getHealthRecordById(linkedHealthRecordId)
              .then(hr  => { if (!cancelled) setHealthRecord(hr); })
              .catch(err => console.error("Failed to load health record:", err))
              .finally(() => { if (!cancelled) setHealthLoading(false); });
          }
        })
        .catch(err => console.error("Failed to load prenatal record:", err));

      return () => { cancelled = true; };
    }

    if (resolvedHealthRecordId) {
      let cancelled = false;

      setHealthLoading(true);
      getHealthRecordById(resolvedHealthRecordId)
        .then(data => { if (!cancelled) setHealthRecord(data); })
        .catch(err  => console.error("Failed to load health record:", err))
        .finally(() => { if (!cancelled) setHealthLoading(false); });

      return () => { cancelled = true; };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Form handlers ── */
  const set         = (k, v)      => setForm(f => ({ ...f, [k]: v }));
  const handle      = (e)         => set(e.target.name, e.target.value);
  const handleRadio = (name, val) => set(name, val);
  const handleCheck = (key, checked) =>
    setForm(f => ({ ...f, checklist: { ...f.checklist, [key]: checked } }));
  const updateVisit = (tr, idx, field, val) =>
    setForm(f => ({
      ...f,
      visits: { ...f.visits, [tr]: f.visits[tr].map((r, i) => i === idx ? { ...r, [field]: val } : r) },
    }));
  const updatePP = (idx, field, val) =>
    setForm(f => ({
      ...f,
      postPartum: f.postPartum.map((r, i) => i === idx ? { ...r, [field]: val } : r),
    }));

  const goToStep = (idx) => {
    setActiveStep(idx);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (activeStep === 3 && !form.lastMenstruation) {
      setLmpError(true);
      return;
    }
    setLmpError(false);
    setCompletedSteps(s => new Set([...s, activeStep]));
    goToStep(Math.min(activeStep + 1, totalSteps - 1));
  };

  const handlePrev = () => {
    setLmpError(false);
    goToStep(Math.max(activeStep - 1, 0));
  };

  /* ── Navigation helpers ── */
  // FIX 2: back button always navigates to the monitoring page
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(NAV_TARGET);
    }
  };

  const handleSave = async () => {
    if (!form.lastMenstruation) {
      setLmpError(true);
      setActiveStep(3);
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const confirmed = await showWarningAlert({
      title: isEditMode ? "Confirm Update" : "Confirm Save",
      text:  isEditMode
        ? "Are you sure you want to update this record? This action cannot be undone."
        : "Are you sure you want to save this pre-natal record?",
    });
    if (!confirmed) return;

    const effectiveHealthRecordId =
      resolvedHealthRecordId
      ?? prenatalRecord?.health_record?.id
      ?? null;

    setSaving(true);
    try {
      const data    = await saveRecord(form, recordId, healthRecord, effectiveHealthRecordId);
      const savedId = data.id ?? data.data?.id;
      if (!recordId && savedId) setRecordId(savedId);
      setCompletedSteps(s => new Set([...s, activeStep]));

      // FIX 1: use isEditMode for the toast message — not recordId — so add mode
      // always says "saved" even after setRecordId(savedId) runs above.
      toastSuccess(
        "Pre-Natal Record",
        isEditMode ? "Pre-Natal Record updated!" : "Pre-Natal Record saved!",
      );

      onSaved?.(data);

      // FIX 2: navigate to monitoring list after save/update
      navigate(NAV_TARGET);
    } catch (e) {
      toastError("Error", "Failed to save record. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset the form? All unsaved changes will be lost.")) {
      setForm(blankForm());
      setRecordId(null);
      setCompletedSteps(new Set());
      setActiveStep(0);
      setLmpError(false);
    }
  };

  const stepProps = {
    form, handle, set, setForm, handleRadio, handleCheck,
    updateVisit, updatePP, activeTrimester, setActiveTrimester, healthRecord,
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0: return <StepPatient    {...stepProps} />;
      case 1: return <StepHistory    {...stepProps} />;
      case 2: return <StepPlanning   {...stepProps} />;
      case 3: return <StepPregnancy  {...stepProps} />;
      case 4: return <StepVisits     {...stepProps} />;
      case 5: return <StepDelivery   {...stepProps} />;
      case 6: return <StepPostPartum {...stepProps} />;
      default: return null;
    }
  };

  const isLastStep = activeStep === totalSteps - 1;



  return (
    <>
      <Toast toast={toast} />

      <div className="min-h-screen flex flex-col bg-background">


        {/* ── Main ── */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
          <div className="flex gap-6 items-start">

            {/* Sidebar */}
            <div className="hidden lg:block sticky top-[72px] w-64 shrink-0">
              <StepSidebar
                activeStep={activeStep}
                completedSteps={completedSteps}
                totalSteps={totalSteps}
                isEditMode={isEditMode}
                recordId={recordId}
                form={form}
                healthRecord={healthRecord}
                prenatalRecord={prenatalRecord}
                onGoToStep={goToStep}
                onReset={handleReset}
              />
            </div>

            {/* Form card */}
            <div className="flex-1 min-w-0">
              <div className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card">

                {/* Step header */}
                <div className="px-8 py-5 border-b border-border flex items-center gap-3">
                  {(() => {
                    const Icon = STEPS[activeStep].icon;
                    return (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-base font-semibold text-card-foreground">{STEPS[activeStep].label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{STEPS[activeStep].sub}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {activeStep === 3 && !form.lastMenstruation && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={9} /> LMP required
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">Step {activeStep + 1} of {totalSteps}</span>
                  </div>
                </div>

                {/* Mobile step indicators */}
                <div className="lg:hidden px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-1">
                    {STEPS.map((s, i) => {
                      const Icon   = s.icon;
                      const done   = i < activeStep;
                      const active = i === activeStep;
                      return (
                        <div key={i} className="flex items-center flex-1">
                          <button onClick={() => goToStep(i)}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0 transition-all
                              ${done   ? "border-green-500 bg-green-500 text-white"
                                : active ? "border-primary text-primary"
                                : "border-border text-muted-foreground"}`}>
                            {done ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                          </button>
                          {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 ${done ? "bg-green-500/50" : "bg-border"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Loading banner */}
                {healthLoading && (
                  <div className="px-8 py-4 border-b border-border flex items-center gap-2 bg-primary/5">
                    <Loader2 size={13} className="animate-spin text-primary" />
                    <span className="text-xs text-primary">Loading patient data…</span>
                  </div>
                )}

                {/* LMP validation banner */}
                {lmpError && (
                  <div className="px-8 py-3 border-b border-destructive/20 bg-destructive/5 flex items-center gap-2">
                    <AlertTriangle size={13} className="text-destructive flex-shrink-0" />
                    <span className="text-xs text-destructive font-medium">
                      Last Menstruation date is required. Please fill it in before continuing.
                    </span>
                  </div>
                )}

                {/* Body */}
                <div ref={contentRef} className="px-8 py-8 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {renderStep()}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-border bg-muted/20 flex items-center justify-between gap-4">
                  {activeStep === 0 ? (
                    <button type="button" onClick={handleReset}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Clear form
                    </button>
                  ) : (
                    <button type="button" onClick={handlePrev}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:border-ring hover:text-foreground hover:bg-muted/40 transition-all">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  )}

                  {isLastStep ? (
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg btn-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed min-w-[130px] justify-center">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {/* FIX 1: label driven by isEditMode, not recordId */}
                      {isEditMode ? "Update Record" : "Save Record"}
                    </button>
                  ) : (
                    <button onClick={handleNext}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg btn-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                      Continue
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}