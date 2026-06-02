"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { capitalizeWords } from "@/lib/capitalizer";
import { getItem } from "@/utils/localStorageHelper";
import { showWarningAlert } from "@/utils/dialog";
import { toastSuccess } from "@/utils/toast";
import {
  getCertificateTemplate,
  submitCertificateRequest,
} from "@/api/user.certificate"; // 👈 adjust path as needed

export default function DynamicForm({
  templateId,
  requestType,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
}) {
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const resident_data = getItem("resident_data");




const getFullName = (resident) => {
  if (!resident) return "";

  const middleInitial = resident.m_name
    ? `${resident.m_name.charAt(0).toUpperCase()}.`
    : "";

  return [
    resident.f_name,
    middleInitial,
    resident.l_name,
    resident.s_name
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

  useEffect(() => {
    if (!templateId) return;

    getCertificateTemplate(templateId)
      .then((data) => {
        setTemplate(data);

        const initialData = {};

        data.fields.forEach((field) => {
          switch (field.name) {
            case "full_name":
              initialData[field.name] = getFullName(resident_data);
              break;
            case "age":
              initialData[field.name] = resident_data?.age ?? "";
              break;
            case "sex":
              initialData[field.name] = resident_data?.sex
                ? resident_data.sex.charAt(0).toUpperCase() +
                resident_data.sex.slice(1)
                : "";
              break;
            case "purok":
              initialData[field.name] = (resident_data?.purok?.name);
              break;
            case "birthdate":
              initialData[field.name] = resident_data?.b_date
                ? new Date(resident_data.b_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
                : "";
              break;
            case "civil_status":
              initialData[field.name] = resident_data?.civil_status ?? "";
              break;
            default:
              initialData[field.name] = "";
          }
        });

        setFormData(initialData);
      })
      .catch((err) => console.error("Failed to load template:", err))
      .finally(() => setLoading(false));
  }, [templateId]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const confirm = await showWarningAlert(
      requestType
        ? {
          title: "Submit Request",
          text: "Are you sure you want to submit this request?",
          confirmText: "Yes, Submit",
        }
        : {
          title: "Submit Appointment",
          text: "Are you sure you want to submit this appointment?",
          confirmText: "Yes, Submit",
        }
    );

    if (!confirm) return;

    setIsSubmitting(true); // 👈 start loading
    try {
      await submitCertificateRequest(
        templateId,
        formData,
        getFullName(resident_data),
        capitalizeWords(template?.template_name)
      );

      if (requestType) {
        toastSuccess("Request submitted successfully", "Your certificate request was successfully submitted.");
      } else {
        toastSuccess("Appointment submitted successfully", "Your appointment was successfully submitted.");
      }

      onSubmit?.(formData, template);
    } catch (error) {
      console.error("Transaction failed:", error.response?.data || error.message);
    } finally {
      setIsSubmitting(false); // 👈 stop loading
    }
  };

  const handleCancel = () => {
    setFormData(
      Object.fromEntries(Object.keys(formData).map((key) => [key, ""]))
    );
    onCancel?.();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gray-10">
      <Card className="w-full max-w-md sm:max-w-lg lg:max-w-xl max-h-[85vh] flex flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl">
            {capitalizeWords(template.template_name)}
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <CardContent className="flex-1 overflow-auto scrollbar-hide space-y-4">
            {template.fields.map((field) => (
              <div key={field.name} className="flex flex-col">
                <Label htmlFor={field.name} className="mb-1">
                  {capitalizeWords(field.label)}
                </Label>

                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  required={field.required}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  disabled={["full_name", "age", "sex", "purok","birthdate","civil_status"].includes(field.name)}
                />

                {field.helperText && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {field.helperText}
                  </p>
                )}
              </div>
            ))}
          </CardContent>

          <CardFooter className="shrink-0 flex gap-2 border-t pt-4">
            <Button type="submit" className="flex-1 btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Submitting...
                </span>
              ) : (
                submitLabel
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="flex-1 text-red-500"
              onClick={handleCancel}
            >
              {cancelLabel}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}