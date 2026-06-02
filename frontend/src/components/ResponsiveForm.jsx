import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function ResponsiveForm({
  title,
  fields = [],
  onSubmit,
  submitText = "Submit",
  defaultValues = {},
  fieldClassName,
}) {
  const [formData, setFormData] = useState(defaultValues);
  const [warnings, setWarnings] = useState({});

  useEffect(() => {
    setFormData(defaultValues);
  }, [defaultValues]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Block submit if any text/textarea warnings exist
    if (Object.keys(warnings).length > 0) return;

    // Validate required select fields
    const missingRequired = fields.filter(
      (f) => f.required && f.type === "select" && !formData[f.name]
    );
    if (missingRequired.length > 0) {
      setWarnings((prev) => {
        const next = { ...prev };
        missingRequired.forEach((f) => {
          next[f.name] = "This field is required.";
        });
        return next;
      });
      return;
    }

    onSubmit(formData);
  };

  const autoResize = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.overflowY = "hidden";
    el.style.height = `${el.scrollHeight}px`;
  };

  // Shows error but keeps value, does NOT clear it
  const sanitizeValue = (name, value) => {
    const invalid = ["n/a", "na", "none", "n.a"];
    const trimmed = value.trim();

    if (invalid.includes(trimmed.toLowerCase())) {
      setWarnings((prev) => ({
        ...prev,
        [name]: "If there is none, leave it empty.",
      }));
    } else {
      setWarnings((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    return value; // always return the original value
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}

      <div className={fieldClassName ?? "flex flex-col gap-4"}>
        {fields.map((field) => {
          const { name, label, type, options, accept, required, maxLength, min, prefix, colSpan, placeholder } = field;

          return (
            <div
              key={name}
              className={`flex flex-col gap-1 ${colSpan === "full" ? "lg:col-span-2" : ""}`}
            >
              <label className="text-sm font-medium">{label}</label>

              {/* TEXT / NUMBER / EMAIL */}
              {(type === "text" || type === "number" || type === "email") && (
                <div className={`flex items-center ${prefix ? "gap-0" : ""}`}>
                  {prefix && (
                    <span className="inline-flex items-center px-3 h-9 rounded-l-md border border-r-0 border-input text-sm text-muted-foreground">
                      {prefix}
                    </span>
                  )}
                  <Input
                    type={type}
                    required={required}
                    placeholder={placeholder}
                    value={formData[name] ?? ""}
                    maxLength={type !== "number" ? maxLength : undefined}
                    max={type === "number" && maxLength ? Math.pow(10, maxLength) - 1 : undefined}
                    min={type === "number" && min !== undefined ? min : undefined}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (type === "number" && maxLength && value.length > maxLength) {
                        value = value.slice(0, maxLength);
                      }
                      if (type !== "number") {
                        value = sanitizeValue(name, value);
                      }
                      handleChange(name, value);
                    }}
                    onBlur={(e) => {
                      if (type === "number" && min !== undefined && e.target.value !== "") {
                        if (Number(e.target.value) < min) {
                          handleChange(name, String(min));
                        }
                      }
                    }}
                    className={`uppercase ${prefix ? "rounded-l-none" : ""} ${
                      warnings[name] ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                  />
                </div>
              )}

              {/* DATE / DATETIME */}
              {(type === "date" || type === "datetime-local") && (
                <Input
                  type={type}
                  required={required}
                  value={formData[name] ?? ""}
                  onChange={(e) => handleChange(name, e.target.value)}
                />
              )}

              {/* TEXTAREA */}
              {type === "textarea" && (
                <Textarea
                  required={required}
                  placeholder={placeholder}
                  value={formData[name] ?? ""}
                  className={`resize-none overflow-hidden text-justify ${
                    warnings[name] ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                  onChange={(e) => {
                    const value = sanitizeValue(name, e.target.value);
                    handleChange(name, value);
                    autoResize(e.target);
                  }}
                  ref={(el) => autoResize(el)}
                />
              )}

              {/* SELECT */}
              {type === "select" && (
                <Select
                  value={formData[name] ? String(formData[name]) : undefined}
                  onValueChange={(value) => {
                    handleChange(name, value);
                    // Clear the required warning once user picks a value
                    setWarnings((prev) => {
                      const next = { ...prev };
                      delete next[name];
                      return next;
                    });
                  }}
                >
                  <SelectTrigger
                    className={warnings[name] ? "border-red-500 focus:ring-red-500" : ""}
                  >
                    <SelectValue placeholder={placeholder ?? `Select ${label}`} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {options?.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* CHECKBOX */}
              {type === "checkbox" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={Boolean(formData[name])}
                    onCheckedChange={(checked) => handleChange(name, Boolean(checked))}
                  />
                  <span className="text-sm">Yes</span>
                </div>
              )}

              {/* FILE */}
              {type === "file" && (
                <Input
                  type="file"
                  accept={accept}
                  required={required}
                  onChange={(e) => handleChange(name, e.target.files?.[0] || null)}
                />
              )}

              {/* Error message */}
              {warnings[name] && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  ⚠ {warnings[name]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Button
        type="submit"
        disabled={Object.keys(warnings).length > 0}
        className="mt-2 btn-primary lg:col-span-2"
      >
        {submitText}
      </Button>
    </form>
  );
}