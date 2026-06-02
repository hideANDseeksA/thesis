import prisma from "../prisma";
import { decryptAll } from "../utils/crypto.util"; // adjust path if needed

export const getResidentById = async (resident_id: string) => {
  const resident = await prisma.residents.findUnique({
    where: { id: resident_id }, // ✅ correct for UUID
    select: {
      id: true,
      f_name: true,
      l_name: true,
      m_name: true,
    },
  });

  if (!resident) return null;


  
  const [decrypted] = decryptAll([resident]);


  

  return decrypted;
};

export const formatResidentName = (resident: any) => {

  const fullName = `${resident.f_name} ${
    resident.m_name ? resident.m_name + " " : ""
  }${resident.l_name}`;


  return fullName;
};





