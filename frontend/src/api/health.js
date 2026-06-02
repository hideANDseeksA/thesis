import {api} from "@/lib/axios";

export const createHealthRecord = async (data) => {
    const res = await api.post(`/health_records`, data);
    return res.data;
}

export const getHealthRecords = async () => {
    const res = await api.get(`/health_records`);
    return res.data;
}

export const getHealthRecordById = async (id) => {
    const res = await api.get(`/health_records/${id}`);
    return res.data;
}

export const updateHealthRecord = async (id, data) => {
    const res = await api.put(`/health_records/${id}`, data);
    return res.data;
}

export const deleteHealthRecord = async (id) => {
    const res = await api.delete(`/health_records/${id}`);
    return res.data;
}