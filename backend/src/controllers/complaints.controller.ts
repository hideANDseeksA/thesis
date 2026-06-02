import { Request, Response } from "express"
import prisma from "../prisma"
import { uploadToSupabase } from "../utils/supabaseUpload.util"
import { generateSignedUrl } from "../utils/supabaseUrl.util"
import { updateSupabaseFile } from "../utils/supabaseUpdate.util"
import { deleteFromSupabase } from "../utils/supabaseDelete.util"
import { decrypt, safeDecrypt } from "../utils/crypto.util"
import { sendNotification } from "../service/notification.service"
import { getResidentById, formatResidentName } from "../utils/resident.helper";

export const createComplaints = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { resident_id ,complaint_type, description } = req.body;
    const file = req.file;

    if (!resident_id || !complaint_type || !description) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (!file) {
      res.status(400).json({ error: "Image is required" });
      return;
    }

    const resident = await getResidentById(resident_id);

    if (!resident) {
      res.status(404).json({ error: "Resident not found" });
      return;
    }

    const name = formatResidentName(resident);

    const image_paths = await uploadToSupabase({
      bucket: "complaints",
      file,
    });

    const complaint = await prisma.complaints.create({
      data: {
        resident_id,
        complaint_type,
        description,
        status: "pending",
        image_paths,
      },
    });

const submittedOn = new Date().toLocaleString("en-PH", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

await sendNotification(resident_id, "staff", {
  title: "New Complaint Submitted",
  message:
    `This is to formally notify you that a new complaint has been submitted by a resident and is now awaiting your review.\n\n` +
    `Complaint Details:\n` +
    `• Complaint ID     : ${complaint.id}\n` +
    `• Complaint Type   : ${decrypt(complaint_type)}\n` +
    `• Submitted By     : ${name}\n` +
    `• Status           : Pending\n` +
    `• Date Submitted   : ${submittedOn}\n\n` +
    `Description:\n` +  
    `${decrypt(description)}\n\n` +
    `Please review the complaint at your earliest convenience and take the necessary action to assist the resident.`,
  from: name,
  type: "info",
});
    res.status(201).json(complaint);
    console.log("Role: resident");
    console.log("New complaint created with ID:", complaint.id);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

/* READ ALL */

export const getcomplaints = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const complaints = await prisma.complaints.findMany({
  include: {
    resident: {
      select: {
        resident_id: true,
        f_name: true,
        m_name: true,
        l_name: true,
        purok: {
          select: {
            name: true,
          },
        },
      },
    },
  },
  orderBy: {
    created_at: 'desc', 
  },
});


    // Monthly resolved count
    const monthlyResolvedCount: Record<string, number> = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0,
      May: 0, Jun: 0, Jul: 0, Aug: 0,
      Sep: 0, Oct: 0, Nov: 0, Dec: 0,
    };

    // 🔹 Status counts
    const statusCounts = {
      pending: 0,
      on_process: 0,
      resolved: 0,
      declined: 0,
    };

    const result = await Promise.all(
      complaints.map(async (comp) => {

        // Count status
        if (comp.status === "pending") statusCounts.pending++;
        if (comp.status === "on action") statusCounts.on_process++;
        if (comp.status === "resolved") statusCounts.resolved++;
        if (comp.status === "declined") statusCounts.declined++;

        // Count resolved per month
        if (comp.status === "resolved") {
          const month = comp.created_at.toLocaleString("en-US", {
            month: "short",
          });
          monthlyResolvedCount[month]++;
        }

        // Decrypt resident names
        if (comp.resident) {
          comp.resident.f_name =
            comp.resident.f_name && decrypt(comp.resident.f_name);
          comp.resident.m_name =
            comp.resident.m_name && decrypt(comp.resident.m_name);
          comp.resident.l_name =
            comp.resident.l_name && decrypt(comp.resident.l_name);
        }

        comp.complaint_type =
          comp.complaint_type && decrypt(comp.complaint_type);
        comp.description =
          comp.description && decrypt(comp.description);

        return {
          ...comp,
          image_url: comp.image_paths
            ? await generateSignedUrl(comp.image_paths, 60 * 5)
            : null,
        };
      })
    );

    res.json({
      complaints: result,
      monthlyResolvedCount,
      statusCounts,
      totalComplaints: complaints.length,
    });
    console.log("role: staff");
    console.log("Fetched complaints with statistics. Total complaints:", complaints.length);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
};



/* UPDATE */
export const updatecomplaints = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { handler, status } = req.body;
    const file = req.file;

    const existing = await prisma.complaints.findUnique({
      where: { id },
      include: {
        resident: true,   // get complainant name
      },
    });

    if (!existing) {
      res.status(404).json({ error: "Complaint not found" });
      return;
    }

    const handler_resident = await getResidentById(handler);
    const resident = await getResidentById(existing.resident_id);

    if (!handler_resident) {
      res.status(404).json({ error: "Resident not found" });
      return;
    }

    const handler_name = formatResidentName(handler_resident);
    const resident_name = formatResidentName(resident);

    let image_paths = existing.image_paths;

    if (file) {
      image_paths = await updateSupabaseFile({
        bucket: "complaints",
        file,
        oldPath: existing.image_paths,
      });
    }

    const updated = await prisma.complaints.update({
      where: { id },
      data: {
        status,
        image_paths,
      },
    });

    const updatedOn = new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const detailsBlock =
      `Complaint Details:\n` +
      `• Complaint ID     : ${updated.id}\n` +
      `• Complaint Type   : ${safeDecrypt(existing.complaint_type)}\n` +
      `• Submitted By     : ${resident_name}\n` +
      `• Handled By       : ${handler_name}\n` +
      `• Status           : ${status.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}\n` +
      `• Last Updated     : ${updatedOn}`;

    let message = "";
    let title = "";
    let type: "info" | "success" | "warning" = "info";

    if (status === "on review") {
      title = "Complaint Now Under Review";
      type = "info";
      message =
        `This is to formally notify you that your complaint has been officially received and is currently under review by the Barangay Office.\n\n` +
        `${detailsBlock}\n\n` +
        `You will be notified once the evaluation process has been completed. We appreciate your patience and cooperation.`;

    } else if (status === "on action") {
      title = "Complaint Under Action";
      type = "info";
      message =
        `This is to formally notify you that your complaint has been reviewed and is now undergoing the necessary course of action.\n\n` +
        `${detailsBlock}\n\n` +
        `The assigned officer is taking the appropriate steps to address your concern. We appreciate your understanding as we work towards a resolution.`;

    } else if (status === "resolved") {
      title = "Complaint Resolved";
      type = "success";
      message =
        `This is to formally notify you that your complaint has been successfully resolved by the Barangay Office.\n\n` +
        `${detailsBlock}\n\n` +
        `If you have any further concerns or require additional assistance, please do not hesitate to visit or contact the Barangay Office directly. Thank you for bringing this matter to our attention.`;

    } else if (status === "declined") {
      title = "Complaint Declined";
      type = "warning";
      message =
        `This is to formally notify you that after careful review, your complaint has been declined by the Barangay Office.\n\n` +
        `${detailsBlock}\n\n` +
        `If you believe this decision requires further clarification or you wish to appeal, please visit or coordinate directly with the Barangay Office. We thank you for your understanding.`;

    } else {
      title = "Complaint Status Updated";
      type = "info";
      message =
        `This is to formally notify you that the status of your complaint has been updated by the Barangay Office.\n\n` +
        `${detailsBlock}\n\n` +
        `Please check your account for further details or contact the Barangay Office if you have any concerns.`;
    }

    await sendNotification(updated.resident_id, "resident", {
      title,
      message,
      from: "Barangay Office",
      type,
    });

    res.json(updated);
    console.log("role: staff");
    console.log("Complaint with ID", updated.id, "updated to status:", status, "and notification sent to resident.");
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
};

/* DELETE */
export const deletecomplaints = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1️⃣ Find the complaints to get image_paths
    const existing = await prisma.complaints.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      res.status(404).json({ error: "complaints not found" })
      return
    }

    // 2️⃣ Delete file from Supabase if exists
    if (existing.image_paths) {
      await deleteFromSupabase({
        bucket: "complaints",
        path: existing.image_paths,
      })
    }

    // 3️⃣ Delete record from DB
    await prisma.complaints.delete({
      where: { id: req.params.id },
    })

    res.json({ message: "complaints deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    })
  }
}
