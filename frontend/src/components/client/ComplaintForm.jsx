
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getItem } from "@/utils/localStorageHelper";
import { api } from "@/lib/axios";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const COMPLAINT_TYPES = [
  {
    group: "Neighbor & Personal Conflicts",
    items: [
      { label: "Neighbor Dispute", value: "Neighbor Dispute" },
      { label: "Boundary / Lot Dispute", value: "Boundary / Lot Dispute" },
      { label: "Verbal Abuse / Oral Defamation", value: "Verbal Abuse / Oral Defamation" },
      { label: "Threats / Intimidation", value: "Threats / Intimidation" },
      { label: "Harassment", value: "Harassment" },
    ],
  },
  {
    group: "Peace & Order",
    items: [
      { label: "Noise Disturbance", value: "Noise Disturbance" },
      { label: "Public Nuisance", value: "Public Nuisance" },
      { label: "Drunken Behavior", value: "Drunken Behavior" },
      { label: "Disorderly Conduct", value: "Disorderly Conduct" },
      { label: "Curfew Violation", value: "Curfew Violation" },
    ],
  },
  {
    group: "Physical Harm (Minor Only)",
    items: [{ label: "Minor Physical Injury", value: "Minor Physical Injury" }],
  },
  {
    group: "Property & Environment",
    items: [
      { label: "Damage to Property", value: "Damage to Property" },
      { label: "Illegal Garbage Disposal", value: "Illegal Garbage Disposal" },
      { label: "Blocked Road / Right of Way", value: "Blocked Road / Right of Way" },
      { label: "Illegal Construction / Obstruction", value: "Illegal Construction / Obstruction" },
    ],
  },
  {
    group: "Financial & Civil Matters",
    items: [
      { label: "Unpaid Debt", value: "Unpaid Debt" },
      { label: "Unpaid Rent", value: "Unpaid Rent" },
      { label: "Breach of Agreement", value: "Breach of Agreement" },
    ],
  },
  {
    group: "Family & Domestic (Non-VAWC)",
    items: [
      { label: "Family Dispute", value: "Family Dispute" },
      { label: "Child Neglect / Discipline Issue", value: "Child Neglect / Discipline Issue" },
      { label: "Marital Disagreement", value: "Marital Disagreement" },
    ],
  },
  {
    group: "Youth & Community Discipline",
    items: [
      { label: "Youth Misbehavior", value: "Youth Misbehavior" },
      { label: "School-Related Dispute", value: "School-Related Dispute" },
    ],
  },
  {
    group: "Animals",
    items: [
      { label: "Stray Animals", value: "Stray Animals" },
      { label: "Animal Bite Incident", value: "Animal Bite Incident" },
      { label: "Animal Noise / Nuisance", value: "Animal Noise / Nuisance" },
    ],
  },
  {
    group: "Business & Local Concerns",
    items: [
      { label: "Small Business Dispute", value: "Small Business Dispute" },
      { label: "Illegal Vending", value: "Illegal Vending" },
    ],
  },
  {
    group: "Other",
    items: [{ label: "Other", value: "Other" }],
  },
];

// ─── Inner form ───────────────────────────────────────────────────────────────
function ComplaintForm({ onSuccess, onCancel }) {
  const [complaintType, setComplaintType] = useState("");
  const [detail, setDetail] = useState("");

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const fileInputRef = useRef(null);

  const resident_id = getItem("resident_id");
  const resident_data = getItem("resident_data");

  const getFullName = (resident) => {
    if (!resident) return "";
    return [resident.f_name, resident.m_name, resident.l_name, resident.s_name]
      .filter(Boolean)
      .join(" ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const validate = () => {
    const e = {};
    if (!complaintType) e.complaintType = "Please select a complaint type.";
    if (!detail.trim()) e.detail = "Please describe your complaint.";
    else if (detail.trim().length < 20)
      e.detail = "Please provide at least 20 characters.";
    return e;
  };

  // ── File handler ──────────────────────────────────────────────────────────
  const handleFile = (file) => {
    setErrors((prev) => ({ ...prev, media: undefined }));
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        media: "Only image files are allowed.",
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        media: `Image too large. Max 10 MB (your file: ${(file.size / 1024 / 1024).toFixed(1)} MB).`,
      }));
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("resident_id", resident_id);
      formData.append("complaint_type", complaintType);
      formData.append("description", detail.trim());
      if (mediaFile) formData.append("file", mediaFile);

      const res = await api.post("/complaints", formData,
      );


   console.log("Success:", res.data);

      onSuccess?.();
    } catch (err) {
      setApiError(err.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ScrollArea className="max-h-[65vh] pr-1">
        <div className="px-1 space-y-5 pb-2">
          {/* API Error */}
          {apiError && (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* ── Complaint Type ── */}
          <div className="space-y-2">
            <Label htmlFor="complaint-type" className="text-sm font-medium">
              Complaint Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={complaintType}
              onValueChange={(val) => {
                setComplaintType(val);
                setErrors((prev) => ({ ...prev, complaintType: undefined }));
              }}
            >
              <SelectTrigger
                id="complaint-type"
                className={errors.complaintType ? "border-red-400 focus:ring-red-300" : ""}
              >
                <SelectValue placeholder="Select a category…" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {COMPLAINT_TYPES.map((group) => (
                  <SelectGroup key={group.group}>
                    <SelectLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {group.group}
                    </SelectLabel>
                    {group.items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {errors.complaintType && (
              <Alert variant="destructive" className="py-2 px-3">
                <AlertDescription className="text-xs">{errors.complaintType}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* ── Detail ── */}
          <div className="space-y-2">
            <Label htmlFor="detail" className="text-sm font-medium">
              Complaint Details <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="detail"
              rows={4}
              placeholder="Describe your issue in as much detail as possible…"
              value={detail}
              onChange={(e) => {
                setDetail(e.target.value);
                setErrors((prev) => ({ ...prev, detail: undefined }));
              }}
              className={`resize-none ${errors.detail ? "border-red-400 focus-visible:ring-red-300" : ""}`}
            />
            <div className="flex justify-between items-start gap-2">
              {errors.detail ? (
                <Alert variant="destructive" className="py-2 px-3 flex-1">
                  <AlertDescription className="text-xs">{errors.detail}</AlertDescription>
                </Alert>
              ) : (
                <span />
              )}
              <span className={`text-xs whitespace-nowrap mt-1 ${detail.length >= 20 ? "text-emerald-500" : "text-slate-400"}`}>
                {detail.length} / 20 min
              </span>
            </div>
          </div>

          {/* ── Image Upload ── */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Attach Image{" "}
              <span className="text-slate-400 font-normal">(max 10 MB)</span>
            </Label>

            {/* ── Drop zone ── */}
            {!mediaPreview && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`
                  w-full rounded-lg border-2 border-dashed px-6 py-8 text-center cursor-pointer
                  transition-colors duration-150
                  ${dragOver ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-400"}
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18M3 9h18"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Drop image here or{" "}
                      <span className="text-blue-600 underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      PNG, JPG, GIF, WEBP — max 10 MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>
            )}

            {/* ── Image preview ── */}
            {mediaPreview && (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <img src={mediaPreview} alt="Preview" className="w-full object-cover max-h-44" />
                <div className="flex items-center justify-between bg-slate-50 border-t border-slate-200 px-3 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                    <p className="text-xs text-slate-500 truncate max-w-[100px] sm:max-w-[150px]">
                      {mediaFile?.name}
                    </p>
                  </div>
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    onClick={clearMedia}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {errors.media && (
              <Alert variant="destructive" className="py-2 px-3">
                <AlertDescription className="text-xs">{errors.media}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </ScrollArea>

      <Separator className="my-4" />

      <DialogFooter className="gap-2 sm:gap-2">
        <Button
          type="button" variant="outline" className="flex-1"
          disabled={loading}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit" className="flex-1 btn-primary text-white"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Submitting…
            </span>
          ) : (
            "Submit Complaint"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Success view ─────────────────────────────────────────────────────────────
function SuccessView({ onClose }) {
  return (
    <div className="flex flex-col items-center py-8 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Complaint Submitted!</h3>
        <p className="text-sm text-slate-500">We've received your report and will follow up shortly.</p>
      </div>
      <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
        Reference #{Math.random().toString(36).slice(2, 9).toUpperCase()}
      </Badge>
      <DialogFooter className="w-full pt-2">
        <Button className="w-full btn-primary text-white" onClick={onClose}>Done</Button>
      </DialogFooter>
    </div>
  );
}

// ─── Dialog wrapper (exported) ────────────────────────────────────────────────
export default function ComplaintFormDialog({ open, onClose, onSubmitSuccess, trigger }) {
  const [submitted, setSubmitted] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined && onClose !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (val) => {
    if (!val) {
      if (isControlled) onClose();
      else setInternalOpen(false);
      setTimeout(() => setSubmitted(false), 300);
    } else {
      if (!isControlled) setInternalOpen(true);
    }
  };

  const handleClose = () => handleOpenChange(false);
  const handleSuccess = () => { setSubmitted(true); onSubmitSuccess?.(); };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-lg w-[calc(100%-2rem)] px-6 rounded-sm">
        {!submitted ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-red-500" />
                <DialogTitle>File a Complaint</DialogTitle>
              </div>
              <DialogDescription className="ml-3.5">
                Barangay Complaint System. Fields marked <span className="text-red-500">*</span> are required.
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <ComplaintForm onSuccess={handleSuccess} onCancel={handleClose} />
          </>
        ) : (
          <SuccessView onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}