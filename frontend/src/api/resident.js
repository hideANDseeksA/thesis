import {api} from "@/lib/axios";


export const getResidentDatabyId = async (id) => {
    const res = await api.get(`/residents/${id}`);
    return res.data;
}