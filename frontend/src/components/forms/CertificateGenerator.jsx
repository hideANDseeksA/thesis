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
import axios from "axios";
import { showSuccessAlert } from "@/utils/swal";
import { apiWithLoading } from "@/lib/axios";


export default function DynamicForm({
transactionId,
  templateId,
  baseUrl = `${import.meta.env.VITE_API_URL}/api/certificates`,
  submitLabel = "Generate", 
  cancelLabel = "Cancel",
  initialData = {},
  onSubmit,
  onCancel,
}) {
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!templateId) return;

    apiWithLoading.get(`${baseUrl}/${templateId}/form`)
      .then((res) => res.data)
      .then((data) => {
        setTemplate(data);

        const formInitialData = {};
        data.fields.forEach((field) => {
          formInitialData[field.name] = initialData[field.name] || "";
        });

        setFormData(formInitialData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [templateId, baseUrl, initialData]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await apiWithLoading.put(
      `/generator/transactions/${transactionId}/generate`,
      {
        certificate_id: templateId,
        details: formData,
      },
      {
        responseType: "blob", // ← important for files
      }
    );

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Optional: set a default filename
    link.setAttribute(
      "download",
      `${template.template_name || "certificate"}.docx`
    );

    document.body.appendChild(link);
    link.click();
    link.remove();
    onSubmit?.(formData, template);
    await showSuccessAlert("Certificate has been generated successfully!");
    
  } catch (error) {
    console.error("Transaction failed:", error.response?.data || error.message);
  }
};


  const handleCancel = () => {
    setFormData(
      Object.fromEntries(
        Object.keys(formData).map((key) => [key, initialData[key] || ""])
      )
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
                  value={formData[field.name]}
                  onChange={handleChange}
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
            <Button type="submit" className="flex-1 btn-primary">
              {submitLabel}
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
