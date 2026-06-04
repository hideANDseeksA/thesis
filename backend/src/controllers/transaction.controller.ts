import { Request, Response } from "express"
import prisma from "../prisma"
import { generateSignedUrl } from "../utils/supabaseUrl.util"
import { generateCertificate } from "../utils/certificates/helper.generateCertificate"
import { safeDecrypt, decryptAll } from "../utils/crypto.util"
import { getDayWithSuffix } from "../helper/date.helper"
import { sendNotification } from "../service/notification.service"
import { getResidentById, formatResidentName } from "../utils/resident.helper"
import { getIO } from "../socket" // ✅ import socket

/* CREATE */
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, template, ...transactionData } = req.body;

    const transaction = await prisma.transaction.create({
      data: transactionData,
    });

    const submittedOn = new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // ✅ Emit transaction event to staff (real-time table/list update)
    const io = getIO()
    io.to("role:staff").emit("transaction:new", {
      id: transaction.id,
      template,
      requestedBy: name,
      status: "pending",
      submittedOn,
    })

    // ✅ Notify staff via notification bell
    const staffMessage =
      `This is to formally notify you that a new certificate request has been submitted by a resident and is now awaiting your review.\n\n` +
      `Transaction Details:\n` +
      `• Transaction ID   : ${transaction.id}\n` +
      `• Certificate      : ${template}\n` +
      `• Requested By     : ${name}\n` +
      `• Status           : Pending\n` +
      `• Date Submitted   : ${submittedOn}\n\n` +
      `Please review the request at your earliest convenience to ensure the resident receives timely assistance.`;

    await sendNotification(transaction.resident_id, "staff", {
      title: "New Certificate Request Submitted",
      message: staffMessage,
      from: name,
      type: "info",
    });





    res.status(201).json("Request Sent!");
    console.log("Role:Resident");
    console.log("New transaction created with ID:", transaction.id);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};
/* READ ALL */
export const getOnlineRequest = async (_req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        certificate: {
          is: {
            requestType: true,
          },
        },
        status: { in: ["pending", "on process", "ready to claim"] }
      },
      include: {
        certificate: {
          select: {
            template_name: true,
            template_price: true,
          },
        },
        resident: {
          select: {
            f_name: true,
            m_name: true,
            l_name: true,
            email_address: true,
            resident_id: true,
            purok: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })


    transactions.forEach(tx => {
      if (tx.certificate) {
        tx.certificate.template_name = safeDecrypt(tx.certificate.template_name);
      }

      if (tx.resident) {
        tx.resident.f_name = tx.resident.f_name && safeDecrypt(tx.resident.f_name);
        tx.resident.m_name = tx.resident.m_name && safeDecrypt(tx.resident.m_name);
        tx.resident.l_name = tx.resident.l_name && safeDecrypt(tx.resident.l_name);
        tx.resident.email_address = tx.resident.email_address && safeDecrypt(tx.resident.email_address);

      }
    });





    res.status(200).json(transactions);
    console.log("Role: staff");
    console.log("Fetched online requests list. Total transactions in this query:", transactions.length);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
};



/* READ ALL */
export const getAppointment = async (_req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        certificate: {
          is: {
            requestType: false,
          },
        },
        status: { in: ["pending", "approved","ready to claim","on process"] }
      },
      include: {
        certificate: {
          select: {
            template_name: true,
            template_price: true,
          },
        },
        resident: {
          select: {
            f_name: true,
            m_name: true,
            l_name: true,
            email_address: true,
            resident_id: true,
            purok: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })


    transactions.forEach(tx => {
      if (tx.certificate) {
        tx.certificate.template_name = safeDecrypt(tx.certificate.template_name);
      }

      if (tx.resident) {
        tx.resident.f_name = tx.resident.f_name && safeDecrypt(tx.resident.f_name);
        tx.resident.m_name = tx.resident.m_name && safeDecrypt(tx.resident.m_name);
        tx.resident.l_name = tx.resident.l_name && safeDecrypt(tx.resident.l_name);
        tx.resident.email_address = tx.resident.email_address && safeDecrypt(tx.resident.email_address);

      }
    });





    console.log("Role: staff");
    console.log("Fetched online requests list. Total transactions in this query:", transactions.length);
    res.status(200).json(transactions);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
};





export const getHistory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        status: { in: ["completed", "declined", "cancelled", "expired"] }
      },
      orderBy: {
        timestamp: "desc",
      },
      include: {
        certificate: {
          select: {
            template_name: true,
            template_price: true,
          },
        },
        resident: {
          select: {
            f_name: true,
            m_name: true,
            l_name: true,
            email_address: true,
            resident_id: true,
            purok: {
              select: {
                name: true,
              },
            },
          },
        },
        handled_by: {
          select: {
            f_name: true,
            m_name: true,
            l_name: true,
          },
        },
      },
    })
    transactions.forEach(tx => {
      if (tx.certificate) {
        tx.certificate.template_name = safeDecrypt(tx.certificate.template_name);
      }

      if (tx.resident) {
        tx.resident.f_name = tx.resident.f_name && safeDecrypt(tx.resident.f_name);
        tx.resident.m_name = tx.resident.m_name && safeDecrypt(tx.resident.m_name);
        tx.resident.l_name = tx.resident.l_name && safeDecrypt(tx.resident.l_name);
        tx.resident.email_address = tx.resident.email_address && safeDecrypt(tx.resident.email_address);
      }

      if (tx.handled_by) {
        tx.handled_by.f_name = tx.handled_by.f_name && safeDecrypt(tx.handled_by.f_name);
        tx.handled_by.m_name = tx.handled_by.m_name && safeDecrypt(tx.handled_by.m_name);
        tx.handled_by.l_name = tx.handled_by.l_name && safeDecrypt(tx.handled_by.l_name);
      }
    });





    res.status(200).json(transactions);
    console.log("Role: staff");
    console.log("Fetched transaction history list. Total transactions in this query:", transactions.length);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
};


export const getTransactionByIds = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "resident id is required" });
      return;
    }

    const result: any[] = await prisma.$queryRaw`
      SELECT "smart-barangay".get_resident_summary(${id}::uuid);
    `;

    const data = result[0]?.get_resident_summary;

    if (!data) {
      res.status(404).json({ message: "Data not found" });
      return;
    }


    const resident = data.resident;
    if (resident) {
      resident.f_name = resident.f_name && safeDecrypt(resident.f_name);
      resident.m_name = resident.m_name && safeDecrypt(resident.m_name);
      resident.l_name = resident.l_name && safeDecrypt(resident.l_name);
      resident.s_name = resident.s_name && safeDecrypt(resident.s_name);
      resident.civil_status = resident.civil_status && safeDecrypt(resident.civil_status);

      resident.b_place = resident.b_place && safeDecrypt(resident.b_place);
      resident.contact_no = resident.contact_no && safeDecrypt(resident.contact_no);
      resident.house_no = resident.house_no && safeDecrypt(resident.house_no);
      resident.email_address = resident.email_address && safeDecrypt(resident.email_address);
    }


    data.latest_documents?.forEach((doc: any) => {

      // 🔐 safeDecrypt title
      if (doc.title) {
        const safeDecrypted = safeDecrypt(doc.title);
        try {
          doc.title = JSON.parse(safeDecrypted);
        } catch {
          doc.title = safeDecrypted;
        }
      }

      if (doc.purpose) {
        const safeDecrypted = safeDecrypt(doc.purpose);
        try {
          doc.purpose = JSON.parse(safeDecrypted);
        } catch {
          doc.purpose = safeDecrypted;
        }
      }

      // 🔐 safeDecrypt document type fields
      if (doc.document_type) {

        if (doc.document_type.name) {
          const safeDecrypted = safeDecrypt(doc.document_type.name);
          try {
            doc.document_type.name = JSON.parse(safeDecrypted);
          } catch {
            doc.document_type.name = safeDecrypted;
          }
        }

        if (doc.document_type.description) {
          const safeDecrypted = safeDecrypt(doc.document_type.description);
          try {
            doc.document_type.description = JSON.parse(safeDecrypted);
          } catch {
            doc.document_type.description = safeDecrypted;
          }
        }

      }

    });

    for (const doc of data.latest_documents || []) {

      if (doc.file_url) {
        doc.file_url = await generateSignedUrl(doc.file_url, 60 * 5);
      }

    }

    data.latest_transactions?.forEach((tx: any) => {

      if (tx.details) {
        const safeDecrypted = safeDecrypt(tx.details);
        try {
          tx.details = JSON.parse(safeDecrypted);
        } catch {
          tx.details = safeDecrypted;
        }
      }


      if (tx.certificate?.template_name) {
        tx.certificate.template_name = safeDecrypt(tx.certificate.template_name);
      }
    });

    data.latest_complaints?.forEach((comp: any) => {
      if (comp.description) {
        const safeDecrypted = safeDecrypt(comp.description);
        const complaint_type = safeDecrypt(comp.complaint_type);
        try {
          comp.description = JSON.parse(safeDecrypted);
          comp.complaint_type = JSON.parse(complaint_type);
        } catch {
          comp.description = safeDecrypted;
          comp.complaint_type = complaint_type;
        }
      }
    });


    res.status(200).json(data);
    console.log("Fetched transaction summary for resident ID:", id);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
};




export const getTransactionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { resident_id: req.params.resident_id },
      include: {
        certificate: {
          select: {
            template_name: true,
            template_price: true,
          },
        },
      },
    });

    if (transactions.length === 0) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }

    
    const decryptedTransactions = transactions.map((tx) => ({
      ...tx,
      certificate: tx.certificate
        ? {
            ...tx.certificate,
            template_name: safeDecrypt(tx.certificate.template_name),
          }
        : null,
    }));

    res.status(200).json(decryptedTransactions);
    console.log("Role: resident");
    console.log("Fetched transaction list for resident ID:", req.params.resident_id, "Total transactions in this query:", decryptedTransactions.length);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
};

    /* UPDATE */
    export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
      try {
        const { appointment_date, status, handled_by_id } = req.body;

        const transaction = await prisma.transaction.update({
          where: { id: req.params.id },
          data: {
            status,
            ...(appointment_date && {
              appointment_date: new Date(appointment_date),
            }),
            ...(handled_by_id && {
              handler: handled_by_id,
            }),
          },
          include: {
            resident: true,
            certificate: true,
          },
        });

        const resident_name = await getResidentById(transaction.resident_id);
        const name = formatResidentName(resident_name);
        const template = safeDecrypt(transaction.certificate.template_name);

        const handler = await getResidentById(handled_by_id);
        const handler_name = formatResidentName(handler);

        const updatedOn = new Date().toLocaleString("en-PH", {
          timeZone: "Asia/Manila",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // ✅ Emit transaction update to staff (real-time table refresh)
        const io = getIO();
        io.to("role:staff").emit("transaction:updated", {
          id: transaction.id,
          status,
          template,
          updatedBy: handler_name,
          updatedOn,
        });

        // ✅ Also emit to the specific resident so their view updates in real-time
        io.to(`resident:${transaction.resident_id}`).emit("transaction:updated", {
          id: transaction.id,
          status,
          template,
          updatedOn,
        });

        if (status === "approved") {
          const formattedDate = transaction.appointment_date
            ? transaction.appointment_date.toLocaleDateString("en-PH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "To Be Determined";

          await sendNotification(transaction.resident_id, "resident", {
            title: "Certificate Request Approved",
            message:
              `This is to formally notify you that your certificate request has been reviewed and approved by the Barangay Office.\n\n` +
              `Transaction Details:\n` +
              `• Transaction ID   : ${transaction.id}\n` +
              `• Certificate      : ${template}\n` +
              `• Requested By     : ${name}\n` +
              `• Handled By       : ${handler_name}\n` +
              `• Status           : Approved\n` +
              `• Appointment Date : ${formattedDate}\n` +
              `• Last Updated     : ${updatedOn}\n\n` +
              `Please be present on your scheduled appointment date and bring any required documents. Contact the Barangay Office if you have any concerns.`,
            from: "Barangay Office",
            type: "success",
          });

        } else if (status === "declined") {

          await sendNotification(transaction.resident_id, "resident", {
            title: "Certificate Request Declined",
            message:
              `This is to formally notify you that your certificate request has been reviewed and declined by the Barangay Office.\n\n` +
              `Transaction Details:\n` +
              `• Transaction ID   : ${transaction.id}\n` +
              `• Certificate      : ${template}\n` +
              `• Requested By     : ${name}\n` +
              `• Handled By       : ${handler_name}\n` +
              `• Status           : Declined\n` +
              `• Last Updated     : ${updatedOn}\n\n` +
              `If you believe this is an error or require further clarification, please visit or contact the Barangay Office directly.`,
            from: "Barangay Office",
            type: "warning",
          });

        } else {

          await sendNotification(transaction.resident_id, "resident", {
            title: "Certificate Request Update",
            message:
              `This is to formally notify you that the status of your certificate request has been updated.\n\n` +
              `Transaction Details:\n` +
              `• Transaction ID   : ${transaction.id}\n` +
              `• Certificate      : ${template}\n` +
              `• Requested By     : ${name}\n` +
              `• Handled By       : ${handler_name}\n` +
              `• Status           : ${status.charAt(0).toUpperCase() + status.slice(1)}\n` +
              `• Last Updated     : ${updatedOn}\n\n` +
              `Please check your account for further details or contact the Barangay Office if you have any concerns.`,
            from: "Barangay Office",
            type: "info",
          });
        }

        res.json(transaction);
        console.log("Role: staff");
        console.log("Updated transaction with ID:", transaction.id, "New status:", status);
      } catch (err) {
        console.error(err);
        if (err instanceof Error) {
          res.status(500).json({ error: err.message });
        } else {
          res.status(500).json({ error: "Unknown error occurred" });
        }
      }
    };


export const cancelTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        resident: {
          select: {
            f_name: true,
            l_name: true,
          },
        },
        certificate: {
          select: {
            template_price: true,
            template_name: true,
          },
        },
      },
    });

    if (!existingTransaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    if (["completed", "declined","approved","ready to claim","cancelled","on process"].includes(existingTransaction.status)) {
      res.status(400).json({ error: "Cannot cancel this transaction" });
      return;
    }

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status: "cancelled" },
    });

    const residentName = `${safeDecrypt(existingTransaction.resident.f_name)} ${safeDecrypt(existingTransaction.resident.l_name)}`;
    const certificateName = safeDecrypt(existingTransaction.certificate.template_name);
    const certificatePrice = existingTransaction.certificate.template_price
      ? `₱${existingTransaction.certificate.template_price.toFixed(2)}`
      : "Free";
    const transactionId = existingTransaction.id;
    const requestedOn = existingTransaction.timestamp.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const cancelledOn = new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // ✅ Emit to staff table so the row is removed in real-time
    const io = getIO();
    io.to("role:staff").emit("transaction:updated", {
      id: transaction.id,
      status: "cancelled",
      cancelledBy: residentName,
      cancelledOn,
    });

    // ✅ Emit to the resident's own room as well (in case they have multiple tabs)
    io.to(`resident:${transaction.resident_id}`).emit("transaction:updated", {
      id: transaction.id,
      status: "cancelled",
      cancelledOn,
    });

    await sendNotification(transaction.resident_id, "staff", {
      title: "Certificate Request Cancelled",
      message:
        `This is to formally notify you that the following certificate request has been cancelled by the resident.\n\n` +
        `Transaction Details:\n` +
        `• Transaction ID   : ${transactionId}\n` +
        `• Certificate      : ${certificateName}\n` +
        `• Fee              : ${certificatePrice}\n` +
        `• Requested By     : ${residentName}\n` +
        `• Date Requested   : ${requestedOn}\n` +
        `• Status           : Cancelled\n` +
        `• Date Cancelled   : ${cancelledOn}\n\n` +
        `No further action is required for this transaction. ` +
        `Should you have any concerns, please coordinate with the resident directly.`,
      from: residentName,
      type: "warning",
    });

    res.json({
      message: "Transaction cancelled successfully",
      transaction,
    });

    console.log(`Transaction with ID ${transaction.id} cancelled by resident ${residentName}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
/* DELETE */
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.transaction.delete({
      where: { id: req.params.id },
    })

    res.json({ message: "transaction deleted successfully" })
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}



export const generateTransactionCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        certificate: {
          select: { template_path: true },
        },
      },
    })

    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" })
      return
    }
    `x`
    if (!transaction.details) {
      res.status(400).json({ error: "Certificate data missing" })
      return
    }

    if (!transaction.certificate?.template_path) {
      res.status(400).json({ error: "Template not configured" })
      return
    }

    // 🔓 safeDecrypt + parse JSON
    let certificateData: Record<string, string>
    try {
      const safeDecrypted = safeDecrypt(transaction.details)
      certificateData = JSON.parse(safeDecrypted)
      const now = new Date()
      const dayth = getDayWithSuffix(now.getDate())
      const month = now.toLocaleString("en-US", { month: "long" })
      const year = now.getFullYear()

      certificateData.issued = `${dayth} day of ${month} ${year}`
    } catch {
      res.status(400).json({ error: "Invalid certificate details format" })
      return
    }

    const templateUrl = await generateSignedUrl(
      transaction.certificate.template_path,
      60 * 5
    )

    if (!templateUrl) {
      res.status(500).json({ error: "Failed to generate template URL" })
      return
    }

    // 🧾 Generate DOCX buffer (NO FILE SYSTEM)
    const buffer = await generateCertificate(templateUrl, certificateData)

    // 📥 Force download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${transaction.id}.docx"`
    )
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    res.send(buffer)
    console.log("Role: staff");
    console.log("Generated certificate for transaction ID:", transaction.id);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Certificate generation failed",
    })
  }
}


  export const createAndGenerateCertificate = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { certificate_id, resident_id, details, handler } = req.body

      if (!certificate_id || !resident_id || !details) {
        res.status(400).json({ error: "certificate_id, resident_id, and details are required" })
        return
      }


      let plainDetails: Record<string, any>
      try {
        const decrypted = decryptAll(details)
        plainDetails = typeof decrypted === "string" ? JSON.parse(decrypted) : decrypted
      } catch {
        res.status(400).json({ error: "Failed to decrypt or parse details" })
        return
      }

      // 1️⃣ Create transaction (details is already encrypted by middleware — store as-is)
      const transaction = await prisma.transaction.create({
        data: {
          certificate_id,
          resident_id,
          details,          // already encrypted string from middleware
          status: "completed",   // directly set to completed since we're generating immediately
          handler,
        },
        include: {
          certificate: { select: { template_path: true } },
        },
      })

      if (!transaction.certificate?.template_path) {
        res.status(400).json({ error: "Template not configured for this certificate" })
        return
      }

      // 2️⃣ Prepare certificate data using the already-decrypted plain object
      const now = new Date()
      const dayth = getDayWithSuffix(now.getDate())
      const month = now.toLocaleString("en-US", { month: "long" })
      const year = now.getFullYear()

      const certificateData: Record<string, any> = {
        ...plainDetails,                               // ✅ spread object, not string
        issued: `${dayth} day of ${month} ${year}`,
      }

      // 3️⃣ Generate template URL
      const templateUrl = await generateSignedUrl(transaction.certificate.template_path, 60 * 5)
      if (!templateUrl) {
        res.status(500).json({ error: "Failed to generate template URL" })
        return
      }

      // 4️⃣ Generate DOCX buffer
      const buffer = await generateCertificate(templateUrl, certificateData)

      // 5️⃣ Update status to completed (async)
      prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "completed" },
      }).catch(console.error)

      // 6️⃣ Send buffer for download
      res.setHeader("Content-Disposition", `attachment; filename="certificate-${transaction.id}.docx"`)
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      res.send(buffer)

      console.log("Role: staff");
      console.log("Created transaction with ID:", transaction.id, "and generated certificate immediately");
    } catch (err) {
      console.error(err)
      res.status(500).json({
        error: err instanceof Error ? err.message : "Failed to create transaction and generate certificate",
      })
    }
  }



export const updateAndGenerateCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { details  } = req.body

    if (!id) {
      res.status(400).json({ error: "Transaction id is required" })
      return
    }

    // 1️⃣ Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        details: details ? JSON.stringify(details) : undefined,
        status: "processing",
      },
      include: {
        certificate: { select: { template_path: true } },
      },
    })

    if (!transaction.certificate?.template_path) {
      res.status(400).json({ error: "Template not configured for this certificate" })
      return
    }

    // 2️⃣ Prepare certificate data
    const certificateData: Record<string, any> = details || {}
    const now = new Date()
    const dayth = getDayWithSuffix(now.getDate())
    const month = now.toLocaleString("en-US", { month: "long" })
    const year = now.getFullYear()
    certificateData.issued = `${dayth} day of ${month} ${year}`

    // 3️⃣ Generate template URL
    const templateUrl = await generateSignedUrl(transaction.certificate.template_path, 60 * 5)
    if (!templateUrl) {
      res.status(500).json({ error: "Failed to generate template URL" })
      return
    }

    // 4️⃣ Generate DOCX buffer
    const buffer = await generateCertificate(templateUrl, certificateData)

    // 6️⃣ Send buffer for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${transaction.id}.docx"`
    )
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    res.send(buffer)

    console.log("Role: staff");
    console.log("Generated certificate for transaction ID:", transaction.id);
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to update transaction and generate certificate",
    })
  }
}


type TransactionCase = {
  id: string;
  status: string;
  timestamp: Date;
  appointment_date: Date | null;
};

type TransactionEntry = {
  total: number;
  statuses: Record<string, number>;
  transactions: TransactionCase[];
};

type TransactionReport = Record<string, TransactionEntry>;

// ✅ GET /transaction/report?type=monthly&month=5&year=2026
// ✅ GET /transaction/report?type=yearly&year=2026
export const getTransactionReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();
    const type = (req.query.type as string) ?? "monthly";

    const year = req.query.year
      ? parseInt(req.query.year as string)
      : now.getFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
      res.status(400).json({ error: "Invalid year." });
      return;
    }

    let start: Date;
    let end: Date;
    let label: string;

    if (type === "yearly") {
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31, 23, 59, 59, 999);
      label = `${year}`;
    } else {
      const month = req.query.month
        ? parseInt(req.query.month as string) - 1
        : now.getMonth();

      if (isNaN(month) || month < 0 || month > 11) {
        res.status(400).json({ error: "Invalid month. Use 1-12." });
        return;
      }

      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      label = start.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }

    // ✅ Single query with certificate relation
   const transactions = await prisma.transaction.findMany({
  where: {
    timestamp: {
      gte: start,
      lte: end,
    },
    status: "completed", // ✅ only completed
  },
  select: {
    id: true,
    status: true,
    timestamp: true,
    appointment_date: true,
    certificate: {
      select: {
        template_name: true,
        template_price: true,
      },
    },
  },
  orderBy: { timestamp: "asc" },
});

    // ✅ Decrypt template_name before grouping
    const decrypted = transactions.map((item) => ({
      ...item,
      certificate: item.certificate
        ? {
            ...item.certificate,
            template_name: safeDecrypt(item.certificate.template_name), // ✅
          }
        : null,
    }));

    // ✅ Group by decrypted template_name
    const grouped = decrypted.reduce<TransactionReport>((acc, item) => {
      const key = item.certificate?.template_name ?? "Unknown";

      if (!acc[key]) {
        acc[key] = { total: 0, statuses: {}, transactions: [] };
      }

      acc[key].total += 1;
      acc[key].statuses[item.status] =
        (acc[key].statuses[item.status] ?? 0) + 1;
      acc[key].transactions.push({
        id: item.id,
        status: item.status,
        timestamp: item.timestamp,
        appointment_date: item.appointment_date,
      });

      return acc;
    }, {});

    // ✅ Summary per template
    const summary = Object.entries(grouped)
      .map(([template_name, data]) => ({
        template_name,
        count: data.total,
        statuses: data.statuses,
      }))
      .sort((a, b) => b.count - a.count);

    // ✅ Monthly trend (only for yearly)
    const by_month =
      type === "yearly"
        ? decrypted.reduce<Record<string, number>>((acc, item) => {
            const monthLabel = new Date(item.timestamp).toLocaleString(
              "default",
              { month: "long" }
            );
            acc[monthLabel] = (acc[monthLabel] ?? 0) + 1;
            return acc;
          }, {})
        : undefined;

    // ✅ Total revenue
    const total_revenue = decrypted.reduce((sum, item) => {
      return sum + (item.certificate?.template_price ?? 0);
    }, 0);

    res.status(200).json({
      type,
      label,
      total_transactions: decrypted.length,
      total_revenue,
      ...(by_month && { by_month }),
      summary,
      grouped,
    });

      console.log("Role: staff");
      console.log(`Generated ${type} transaction report for ${label}. Total transactions: ${decrypted.length}, Total revenue: ₱${total_revenue.toFixed(2)}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};