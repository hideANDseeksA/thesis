import { Request, Response } from "express"
import prisma from "../prisma"
import { Prisma } from "@prisma/client"
import { safeDecrypt } from "../utils/crypto.util"
import { calculateAge } from "../helper/agecalculator.helper"

/* CREATE */
export const createHealth_record = async (req: Request, res: Response): Promise<void> => {
  try {
    const health_record = await prisma.health_records.create({
      data: req.body,
    })

    res.status(201).json(health_record)
    console.log("Role: staff");
    console.log("Created new health record with ID:", health_record.id);

  } catch (err) {
    console.error("Error creating health record:", err)

    // ✅ Handle Prisma known errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      
      // Duplicate (UNIQUE constraint)
      if (err.code === "P2002") {
        res.status(409).json({
          error: "Health record already exists for this resident",
          field: err.meta?.target
        })
        return
      }
    }

    // fallback
    res.status(500).json({ error: "Internal server error" })
  }
}


/* READ ALL */
export const getHealth_records = async (_req: Request, res: Response): Promise<void> => {
  try {
 const health_records = await prisma.health_records.findMany({
 where: {
  resident: {
            OR: [
              { remarks: null },
              { remarks: { not: "archive" } },
            ],
          },      
},
  include: {
    resident: {
      select: {
        id: true,
        resident_id: true,
        f_name: true,
        m_name: true,
        md_name: true,
        l_name: true,
        s_name: true,
        house_no: true,
        b_place: true,
        b_date: true,
        sex: true,
        purok_id: true,
        blood_type: true,
        civil_status: true,
        education: true,
        emp_status: true,
        purok: {           
          select: { name: true }
        }
      },
    },
  },
});

// Decrypt the name fields inside each resident
const decryptedRecords = health_records.map(record => ({
  ...record,
  resident: record.resident
    ? {
        ...record.resident,
        f_name: safeDecrypt(record.resident.f_name),
        m_name: safeDecrypt(record.resident.m_name),
        md_name: safeDecrypt(record.resident.md_name),
        l_name: safeDecrypt(record.resident.l_name),
        s_name: safeDecrypt(record.resident.s_name),
        house_no:safeDecrypt(record.resident.house_no),
         b_place:safeDecrypt(record.resident.b_place)
      }
    : null,
}));

res.json(decryptedRecords);
console.log("Role: staff");
console.log("Fetched health records list. Total records in this query:", decryptedRecords.length);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};

/* READ ONE */
export const getHealth_recordById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { record_id } = req.params;

    const health_record = await prisma.health_records.findUnique({
      where: {
        id: record_id,
      },
      select: {
        details: true,
        bmi:true,
        height:true,
        weight:true,
        resident: {
          select: {
            id: true,
            resident_id: true,
            f_name: true,
            m_name: true,
            md_name: true,
            l_name: true,
            s_name: true,
            house_no: true,
            b_date: true,
            sex: true,
            purok: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!health_record) {
      res.status(404).json({ message: "No data found" });
      return;
    }

    const decryptedRecord = {
      ...health_record,
      resident: health_record.resident
        ? {
            ...health_record.resident,
            age:calculateAge(health_record.resident.b_date),
            f_name: safeDecrypt(health_record.resident.f_name),
            m_name: safeDecrypt(health_record.resident.m_name),
            md_name: safeDecrypt(health_record.resident.md_name),
            l_name: safeDecrypt(health_record.resident.l_name),
            s_name: safeDecrypt(health_record.resident.s_name),
            house_no: safeDecrypt(health_record.resident.house_no)
          }
        : null
    };

    res.json(decryptedRecord);
    console.log("Role: staff");
    console.log("Fetched health record with ID:", health_record);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};



export const getHealth_recordsByResidentId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { record_id } = req.params;

    const health_record = await prisma.health_records.findUnique({
      where: {
        id: record_id,
        resident: {
          sex: "female"
        }
      },
      select: {
        details: true,
        resident: {
          select: {
            id: true,
            resident_id: true,
            f_name: true,
            m_name: true,
            md_name: true,
            l_name: true,
            s_name: true,
            house_no: true,
            b_date: true,
            sex: true,
            purok: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!health_record) {
      res.status(404).json({ message: "No data found" });
      return;
    }

    const decryptedRecord = {
      ...health_record,
      resident: health_record.resident
        ? {
            ...health_record.resident,
            f_name: safeDecrypt(health_record.resident.f_name),
            m_name: safeDecrypt(health_record.resident.m_name),
            md_name: safeDecrypt(health_record.resident.md_name),
            l_name: safeDecrypt(health_record.resident.l_name),
            s_name: safeDecrypt(health_record.resident.s_name),
            house_no: safeDecrypt(health_record.resident.house_no)
          }
        : null
    };

    res.json(decryptedRecord);

  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};

/* UPDATE */
export const updateHealth_record = async (req: Request, res: Response): Promise<void> => {
  try {
    const health_record = await prisma.health_records.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(health_record)
    console.log("Role: staff");
    console.log("Updated health record with ID:", health_record.id);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}

/* DELETE */
export const deleteHealth_record = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.health_records.delete({
      where: { id: req.params.id },
    })
    console.log("Role: staff");
    console.log("Deleted health record with ID:", req.params.id);
    res.json({ message: "health_record deleted successfully" })
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}
