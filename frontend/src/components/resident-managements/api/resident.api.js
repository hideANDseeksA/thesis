import {api, apiWithLoading} from "@/lib/axios";

/**
 * 📌 Get all residents (with pagination, search, filters)
 */
export const getResidents = async (params = {}) => {
  const res = await api.get("/residents", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      purok_id: params.purok_id,
    },
  })
  console.log("response:", res.data)
  return res.data
}

export const getBDACResidents = async (params = {}) => {
  const res = await api.get("/residents/bdac", {
    params: {  
        page: params.page,
        limit: params.limit,
    },
  })
  console.log("response:", res.data)
  return res.data
}


export const getArchiveResidents = async (params = {}) => {
  const res = await api.get("/residents/archive", {
    params: {
        page: params.page,
        limit: params.limit,
    },
    })
    console.log("response:", res.data)
    return res.data
}

/**
 * 📌 Get single resident by ID
 */
export const getResidentById = async (id) => {
  const res = await api.get(`/residents/${id}`)
  return res.data
}

/**
 * 📌 Create resident
 */
export const createResident = async (data, force = false) => {
  const res = await apiWithLoading.post("/residents", { ...data, force });
  return res.data;
};
/**
 * 📌 Update resident
 */
export const updateResident = async (id, data) => {
  const res = await apiWithLoading.put(`/residents/${id}`, data)
  return res.data
}

/**
 * 📌 Delete resident
 */
export const deleteResident = async (id) => {
  const res = await apiWithLoading.delete(`/residents/${id}`)
  return res.data
}

/**
 * 📌 Import residents via CSV
 */
export const importResidentsCSV = async (formData) => {
  const res = await api.post("/residents/import-csv", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return res.data
}


export const patchResidentRemarks = async (id, remarks) => {
  const res = await apiWithLoading.patch(`/residents/remarks/${id}/`, { remarks })
  return res.data
}