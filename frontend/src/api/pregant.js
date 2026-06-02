import {api} from "@/lib/axios";


export const getMissedVisit = async () => {
    const res = await api.get(`/pregnancy-monitoring/missed`);
    return res.data;
}

export const getPrenatalRecord = async () => {
    const res = await api.get(`/pregnancy-monitoring`);
    return res.data;
}



export const getPrenatalRecordById = async (id) => {
    const res = await api.get(`/pregnancy-monitoring/${id}`);
    return res.data;
}


export const createPrenatalRecord = async (data) => {
    const res = await api.post(`/pregnancy-monitoring`, data);
    return res.data;
}

export const updatePrenatalRecord = async (id, data) => {
    const res = await api.put(`/pregnancy-monitoring/${id}`, data);
    return res.data;
}

export const deletePrenatalRecord = async (id) => {
    const res = await api.delete(`/pregnancy-monitoring/${id}`);
    return res.data;
}


export const patchPrenatalRecord = async (id, status) => {
    const res = await api.patch(`/pregnancy-monitoring/${id}/status`, { status });
    return res.data;
}





