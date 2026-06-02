import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Save,
  ArrowLeft,
  ArrowRight,
  Paperclip,
  X,
  FileText,
  RotateCcw,
  ClipboardList,
  User,
  UserX,
  BookOpen,
  PenLine,
  Check,
  ChevronLeft,
} from "lucide-react";
import { getItem } from "@/utils/localStorageHelper";
import { apiWithLoading } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { toastSuccess } from "@/utils/toast";
import { showWarningAlert } from "@/utils/dialog";

// ─── Month name → number map ──────────────────────────────────────────────────
const MONTH_MAP = {
  Enero: "01", Pebrero: "02", Marso: "03", Abril: "04",
  Mayo: "05", Hunyo: "06", Hulyo: "07", Agosto: "08",
  Setyembre: "09", Oktubre: "10", Nobyembre: "11", Disyembre: "12",
};

function rebuildDate(day, month, year) {
  if (!day || !month || !year) return "";
  const mm = MONTH_MAP[month] ?? "01";
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function flattenBlotter(payload) {
  const { details = {}, file_url, ...meta } = payload;
  const { signed_day, signed_month, year1, received_day, received_month, year2, ...restDetails } = details;
  return {
    ...meta,
    ...restDetails,
    file_url,
    signed_date: rebuildDate(signed_day, signed_month, year1),
    received_date: rebuildDate(received_day, received_month, year2),
  };
}

const EMPTY_DEFAULTS = {
  date: "", time: "", case_no: "", complaint_type: "",
  name1: "", age1: "", sex1: "", occupation1: "", address1: "",
  name2: "", age2: "", sex2: "", occupation2: "", address2: "",
  complaint_details: "",
  name3: "", contact: "", signed_date: "", received_date: "",
  blotter_file: null,
};

// ─── Preset complaint types (no icons) ───────────────────────────────────────
const COMPLAINT_PRESETS = [
  "Harassment",
  "Road Accident",
  "Theft",
  "Physical Assault",
  "Noise Disturbance",
  "Trespassing",
  "Vandalism",
  "Domestic Dispute",
];

const STEPS = [
  {
    id: 0, label: "Complaint", short: "Complaint", icon: ClipboardList,
    description: "Date, time, case number, and type of complaint",
  },
  {
    id: 1, label: "Complainant", short: "Party 1", icon: User,
    description: "Personal information of the complainant",
  },
  {
    id: 2, label: "Respondent", short: "Party 2", icon: UserX,
    description: "Personal information of the respondent",
  },
  {
    id: 3, label: "Details", short: "Details", icon: BookOpen,
    description: "Full narrative of the incident",
  },
  {
    id: 4, label: "Signatures", short: "Signatures", icon: PenLine,
    description: "Registrant info, dates, and file attachment",
  },
];

const STEP_FIELDS = [
  ["date", "time", "case_no", "complaint_type"],
  ["name1", "age1", "sex1", "occupation1", "address1"],
  ["name2", "age2", "sex2", "occupation2", "address2"],
  ["complaint_details"],
  ["name3", "contact", "signed_date", "received_date"],
];

// ─── Field wrapper ────────────────────────────────────────────────────────────
function FormField({ label, required, error, children, className }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive mt-0.5">
          {error.message || "This field is required"}
        </p>
      )}
    </div>
  );
}

// ─── Sidebar step navigator ───────────────────────────────────────────────────
function StepSidebar({ current, steps, isEdit }) {
  return (
    <aside className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Barangay</p>
            <p className="text-sm font-semibold leading-tight">Blotter Record</p>
          </div>
        </div>
        <div className="mt-3">
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            isEdit
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-primary/10 text-primary"
          )}>
            {isEdit ? "Editing Record" : "New Record"}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const done = idx < current;
          const active = idx === current;
          const upcoming = idx > current;

          return (
            <div key={step.id} className="relative">
              <div className={cn(
                "flex items-start gap-3 rounded-xl px-3 py-3 transition-all duration-150",
                active && "bg-primary/8 ring-1 ring-primary/20",
                done && "opacity-75",
                upcoming && "opacity-35"
              )}>
                {idx < steps.length - 1 && (
                  <div className={cn(
                    "absolute left-[22px] top-[46px] w-0.5 h-[18px]",
                    done ? "bg-primary/40" : "bg-border"
                  )} />
                )}

                <div className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground"
                )}>
                  {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={cn(
                    "text-xs font-medium leading-tight",
                    active ? "text-foreground" : "text-foreground/70"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground">Progress</span>
          <span className="text-[11px] font-medium text-foreground">
            {Math.round((current / (steps.length - 1)) * 100)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full btn-primary transition-all duration-500"
            style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </aside>
  );
}

// ─── Complaint type chip selector ─────────────────────────────────────────────
function ComplaintTypeSelector({ value, onChange, error }) {
  const isPreset = COMPLAINT_PRESETS.includes(value);
  const [showCustom, setShowCustom] = useState(!isPreset && value !== "");
  const [customValue, setCustomValue] = useState(!isPreset ? value : "");

  const handleChipClick = (preset) => {
    setShowCustom(false);
    setCustomValue("");
    onChange(preset);
  };

  const handleOtherClick = () => {
    setShowCustom(true);
    onChange(customValue);
  };

  const handleCustomChange = (e) => {
    const v = e.target.value;
    setCustomValue(v);
    onChange(v);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {COMPLAINT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleChipClick(preset)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-all duration-150 font-medium",
              value === preset
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            {preset}
          </button>
        ))}
        <button
          type="button"
          onClick={handleOtherClick}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm border transition-all duration-150 font-medium",
            showCustom
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
          )}
        >
          Other
        </button>
      </div>

      {showCustom && (
        <Input
          autoFocus
          placeholder="Describe the type of complaint…"
          value={customValue}
          onChange={handleCustomChange}
          className={cn("mt-1", error && "border-destructive")}
        />
      )}

      {error && (
        <p className="text-xs text-destructive">{error.message || "Please select or enter a complaint type"}</p>
      )}
    </div>
  );
}

// ─── Step panels ──────────────────────────────────────────────────────────────
function StepComplaint({ register, errors, watch, setValue, control }) {
  const complaintType = watch("complaint_type") ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Complaint Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the basic details about when and what was reported.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <FormField label="Date" required error={errors.date}>
          <Input
            type="date"
            {...register("date", { required: "Required" })}
            className={errors.date ? "border-destructive" : ""}
          />
        </FormField>

        <FormField label="Time" required error={errors.time}>
          <Input
            type="time"
            {...register("time", { required: "Required" })}
            className={errors.time ? "border-destructive" : ""}
          />
        </FormField>

        <FormField label="Case No." required error={errors.case_no} className="col-span-2">
          <Input
            placeholder="e.g. 2024-001"
            {...register("case_no", { required: "Required" })}
            className={cn(errors.case_no && "border-destructive")}
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-foreground">
          Type of Complaint <span className="text-destructive ml-0.5">*</span>
        </Label>
        <input
          type="hidden"
          {...register("complaint_type", { required: "Please select or enter a complaint type" })}
        />
        <ComplaintTypeSelector
          value={complaintType}
          onChange={(val) => setValue("complaint_type", val, { shouldValidate: true })}
          error={errors.complaint_type}
        />
      </div>
    </div>
  );
}

function StepParty({ register, errors, watch, setValue, prefix, label, description }) {
  const nameField    = `name${prefix}`;
  const ageField     = `age${prefix}`;
  const sexField     = `sex${prefix}`;
  const occupField   = `occupation${prefix}`;
  const addressField = `address${prefix}`;
  const sexValue = watch(sexField) ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{label} Information</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <FormField label="Full Name" required error={errors[nameField]} className="col-span-2">
          <Input
            {...register(nameField, { required: "Required" })}
            className={cn("capitalize", errors[nameField] && "border-destructive")}
            autoComplete="off"
          />
        </FormField>

        <FormField label="Age" required error={errors[ageField]}>
          <Input
            type="number"
            min={1}
            {...register(ageField, { required: "Required" })}
            className={errors[ageField] ? "border-destructive" : ""}
            autoComplete="off"
          />
        </FormField>

        <FormField label="Sex" required error={errors[sexField]}>
          <Select
            value={sexValue}
            onValueChange={(val) => setValue(sexField, val, { shouldValidate: true })}
          >
            <SelectTrigger className={errors[sexField] ? "border-destructive" : ""}>
              <SelectValue placeholder="Select sex…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lalaki">Male</SelectItem>
              <SelectItem value="babae">Female</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register(sexField, { required: "Required" })} />
        </FormField>

        <FormField label="Civil Status / Occupation" required error={errors[occupField]} className="col-span-2">
          <Input
            {...register(occupField, { required: "Required" })}
            className={cn("capitalize", errors[occupField] && "border-destructive")}
            autoComplete="off"
          />
        </FormField>

        <FormField label="Address" required error={errors[addressField]} className="col-span-2">
          <Textarea
            rows={3}
            {...register(addressField, { required: "Required" })}
            className={errors[addressField] ? "border-destructive" : ""}
          />
        </FormField>
      </div>
    </div>
  );
}

function StepDetails({ register, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Incident Details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Provide a full and accurate account of the incident being reported.
        </p>
      </div>

      <FormField label="Complaint Details" required error={errors.complaint_details}>
        <Textarea
          rows={12}
          placeholder="Describe the incident in detail — include what happened, when, where, and any relevant context…"
          {...register("complaint_details", { required: "Required" })}
          className={cn("resize-none leading-relaxed", errors.complaint_details && "border-destructive")}
        />
      </FormField>
    </div>
  );
}

function StepSignatures({ register, errors, watch, setValue, isEdit, existingFileUrl }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Registrant & Signatures</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complete the registrant details and attach the signed blotter file.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <FormField label="Name of Registrant" required error={errors.name3} className="col-span-2">
          <Input
            {...register("name3", { required: "Required" })}
            className={cn("capitalize", errors.name3 && "border-destructive")}
          />
        </FormField>

        <FormField label="Contact Number" required error={errors.contact}>
          <Input
            placeholder="09XXXXXXXXX"
            {...register("contact", { required: "Required" })}
            className={errors.contact ? "border-destructive" : ""}
          />
        </FormField>

        <div />

        <FormField label="Date Signed" required error={errors.signed_date}>
          <Input
            type="date"
            {...register("signed_date", { required: "Required" })}
            className={errors.signed_date ? "border-destructive" : ""}
          />
        </FormField>

        <FormField label="Date Received" required error={errors.received_date}>
          <Input
            type="date"
            {...register("received_date", { required: "Required" })}
            className={errors.received_date ? "border-destructive" : ""}
          />
        </FormField>

        {/* File upload */}
        <div className="col-span-2 space-y-2">
          <Label className="text-sm font-medium">
            Blotter File{" "}
            <span className="text-muted-foreground font-normal">(PDF, optional)</span>
          </Label>

          {isEdit && existingFileUrl && !watch("blotter_file")?.[0] && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm">
              <Paperclip className="w-4 h-4 shrink-0 text-muted-foreground" />
              <a
                href={existingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-primary underline-offset-2 hover:underline"
              >
                View current file
              </a>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">(upload to replace)</span>
            </div>
          )}

          <label
            htmlFor="blotter_file"
            className={cn(
              "flex items-center gap-3 cursor-pointer rounded-lg border-2 border-dashed border-border px-4 py-5 text-sm",
              "text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors",
              watch("blotter_file")?.[0] && "border-primary/40 bg-primary/5"
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
              <Paperclip className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {watch("blotter_file")?.[0]?.name ?? "Click to upload a PDF file"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">PDF only · Max 10 MB</p>
            </div>
            {watch("blotter_file")?.[0] && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setValue("blotter_file", null); }}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </label>
          <Input
            id="blotter_file"
            type="file"
            accept=".pdf"
            className="hidden"
            {...register("blotter_file")}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function BlotterFormPage({ editId: editIdProp } = {}) {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const id = editIdProp ?? paramId;
  const isEdit = Boolean(id);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [existingFileUrl, setExistingFileUrl] = useState(null);

  const userId = getItem("resident_id");

  const {
    register, handleSubmit, setValue, watch, reset, trigger,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_DEFAULTS });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      setExistingFileUrl(null);
      apiWithLoading
        .get(`/blotter/${id}`)
        .then((res) => {
          const flat = flattenBlotter(res.data);
          setExistingFileUrl(flat.file_url ?? null);
          reset(flat);
        })
        .catch((err) => console.error("Fetch failed", err))
        .finally(() => setLoading(false));
    } else {
      reset(EMPTY_DEFAULTS);
      setExistingFileUrl(null);
    }
  }, [id, isEdit, reset]);

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const formatFilipinoDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const months = [
      "Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo",
      "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre",
    ];
    return {
      day: date.getDate().toString(),
      month: months[date.getMonth()],
      year: date.getFullYear().toString(),
    };
  };

  const onSubmit = async (data) => {
    const confirmed = await showWarningAlert({
      title: isEdit ? "Update Blotter Record" : "Save Blotter Record",
      text: isEdit
        ? "Are you sure you want to update this record? This action cannot be undone."
        : "Are you sure you want to save this blotter record?",
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      const file = data.blotter_file?.[0];
      const signed = formatFilipinoDate(data.signed_date);
      const received = formatFilipinoDate(data.received_date);

      const {
        blotter_file, signed_date, received_date,
        id: _id, resident_id: _rid, status: _status,
        file_url: _furl, created_at: _ca, updated_at: _ua,
        ...rest
      } = data;

      const details = {
        ...rest,
        signed_day: signed?.day, signed_month: signed?.month, year1: signed?.year,
        received_day: received?.day, received_month: received?.month, year2: received?.year,
      };

      const formData = new FormData();
      formData.append("details", JSON.stringify(details));
      formData.append("resident_id", userId);
      formData.append("case_no", data.case_no);
      formData.append("type_case", data.complaint_type);
      if (file) formData.append("file", file);

      if (isEdit) {
        await apiWithLoading.put(`/blotter/${id}`, formData);
        toastSuccess("Blotter updated successfully", "The blotter record was successfully updated.");
      } else {
        await apiWithLoading.post("/blotter", formData);
        toastSuccess("Blotter saved successfully", "The blotter record was successfully saved.");
        reset(EMPTY_DEFAULTS);
        setExistingFileUrl(null);
        setStep(0);
      }

      navigate(-1);
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    const props = { register, errors, watch, setValue };
    switch (step) {
      case 0: return <StepComplaint key="step-complaint" {...props} />;
      case 1: return (
        <StepParty
          key="step-party-1"
          {...props}
          prefix="1"
          label="Complainant"
          description="Provide personal details of the person filing the complaint."
        />
      );
      case 2: return (
        <StepParty
          key="step-party-2"
          {...props}
          prefix="2"
          label="Respondent"
          description="Provide personal details of the person being complained about."
        />
      );
      case 3: return <StepDetails key="step-details" {...props} />;
      case 4: return (
        <StepSignatures
          key="step-signatures"
          {...props}
          isEdit={isEdit}
          existingFileUrl={existingFileUrl}
        />
      );
      default: return null;
    }
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen  flex flex-col">
     
      {/* Main content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <div className="hidden lg:block sticky top-[72px] w-64 shrink-0">
            <StepSidebar current={step} steps={STEPS} isEdit={isEdit} />
          </div>

          {/* Form panel */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="rounded-2xl border border-border bg-card flex items-center justify-center h-80 gap-3 text-muted-foreground shadow-sm">
                <Loader2 className="animate-spin w-5 h-5" />
                <span className="text-sm">Loading blotter record…</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
              >
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  {/* Step header strip */}
                  <div className="px-8 py-5 border-b border-border bg-muted/30 flex items-center gap-3">
                    {(() => {
                      const Icon = STEPS[step].icon;
                      return (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-base font-semibold">{STEPS[step].label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{STEPS[step].description}</p>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Step {step + 1} of {STEPS.length}
                    </span>
                  </div>

                  {/* Mobile step bar */}
                  <div className="lg:hidden px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-1">
                      {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const done = i < step;
                        const active = i === step;
                        return (
                          <div key={i} className="flex items-center flex-1">
                            <div className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0 transition-all",
                              done
                                ? "border-primary bg-primary text-primary-foreground"
                                : active
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground"
                            )}>
                              {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className={cn(
                                "flex-1 h-0.5 mx-1",
                                done ? "bg-primary/50" : "bg-border"
                              )} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form body */}
                  <div className="px-8 py-8">
                    {renderStep()}
                  </div>

                  {/* Footer actions */}
                  <div className="px-8 py-5 border-t border-border bg-muted/20 flex items-center justify-between gap-4">
                    {step === 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground"
                        onClick={() => { reset(EMPTY_DEFAULTS); setStep(0); }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear form
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={goPrev}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </Button>
                    )}

                    {isLastStep ? (
                      <Button
                        type="submit"
                        size="sm"
                        disabled={saving}
                        className="gap-2 min-w-[120px] btn-primary"
                      >
                        {saving
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Save className="w-3.5 h-3.5" />
                        }
                        {isEdit ? "Update Record" : "Save Record"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2"
                        onClick={goNext}
                      >
                        Continue
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}