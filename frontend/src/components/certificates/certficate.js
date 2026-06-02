import { apiWithLoading } from "@/lib/axios";


export const createCertificate = (data) => {
  return apiWithLoading.post("/certificates", data, {
  });
}


export const updateCertificate = (id, data) => {
  return apiWithLoading.put(`/certificates/${id}`, data, {
  });
}