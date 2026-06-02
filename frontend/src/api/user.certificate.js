import { api } from "@/lib/axios";
import { getItem } from "@/utils/localStorageHelper"; // ✅ ADD THIS

export const getCertificateList = async () => {
  const res = await api.get(`/certificates/resident`);
  return res.data;
};

export const getCertificateTemplate = async (id) => {
  const res = await api.get(`/certificates/${id}/form`);
  return res.data;
};

export const submitCertificateRequest = async (
  templateId,
  data,
  residentName,
  templateName
) => {
  const response = await api.post(`/transactions`, {
    resident_id: getItem("resident_id"), // ✅ now works
    certificate_id: templateId,
    details: data,
    name: residentName,
    template: templateName,
  });

  return response.data;
};

export const cancelTransaction = async (id) => {
  const res = await api.put(`/transactions/${id}/cancel`);
  return res.data;
};