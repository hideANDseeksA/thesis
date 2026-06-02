import { Request, Response } from "express"
import prisma from "../prisma"
import { uploadToSupabase } from "../utils/supabaseUpload.util"
import { generateSignedUrl } from "../utils/supabaseUrl.util"
import { updateSupabaseFile } from "../utils/supabaseUpdate.util"
import { deleteFromSupabase } from "../utils/supabaseDelete.util"
import { decrypt } from "../utils/crypto.util"
/* CREATE */
export const createDocuments = async (
    req: Request, 
    res: Response): Promise<void> => {
  try {
    
    const{  document_type_id,title ,purpose ,issued_date ,status,is_public, pin} = req.body
    const file = req.file

    if (!file) {
      res.status(400).json({ error: "Template file is required" })
      return
    }

   const file_url= await uploadToSupabase({
      bucket: "documents",
      file,
    })

    const documents = await prisma.documents.create({
        data: {
            document_type_id,
            title,
            purpose,
           issued_date: issued_date ? new Date(issued_date) : null,
            status,
              pin: pin === undefined ? true : pin === "true" || pin === true,
        is_public: is_public === undefined ? true : is_public === "true" || is_public === true,
        

            file_url
        },
    })
    console.log("Role: staff");
    console.log("Created new document with ID:", documents.id);
    res.status(201).json(documents)
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}

/* READ ALL */
export const getDocuments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const documentss = await prisma.documents.findMany({
         include: {
        document_type: {
          select: { name: true },
        },
      },
            
    })

   

    const result = await Promise.all(
        documentss.map(async doc => ({
            ...doc,
            file_url: doc.file_url ? await generateSignedUrl(doc.file_url, 60 * 5) : null,
            document_type: {
              name: decrypt(doc.document_type.name)
            }
        }))
    )

    res.status(200).json(result)
    console.log("Role: staff");
    console.log("Fetched documents list. Total documents in this query:", result.length);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}


export const getResidentDocuments = async (_req: Request, res: Response): Promise<void> => {
  try {
      const documents = await prisma.documents.findMany({
      where: {
        is_public: true,
      },
      select: {
        id: true,
        document_type: {
          select: {
            name: true,
          },
        },
        file_url: true,
        title: true,
        purpose: true,
        issued_date: true,
      },
    })


   

    const result = await Promise.all(
        documents.map(async doc => ({
            ...doc,
            file_url: doc.file_url ? await generateSignedUrl(doc.file_url, 60 * 5) : null,
            document_type: {
              name: decrypt(doc.document_type.name)
            }
        }))
    )

    res.status(200).json(result)
    console.log("Fetched resident documents:", result.length)
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}


/* UPDATE */
export const updateDocuments = async (req: Request, res: Response): Promise<void> => {
  try {

const file = req.file
const {id } = req.params
const { document_type_id,title ,purpose ,issued_date  ,status,pin,is_public} = req.body

const existingDocument = await prisma.documents.findUnique({
  where: { id },
})
if (!existingDocument) {
  res.status(404).json({ message: "Document not found" })
  return
}

let file_url = existingDocument.file_url

if (file) {

  file_url = await updateSupabaseFile({
    bucket: "documents",
    file,
    oldPath: existingDocument.file_url,
  })
}

const documents = await prisma.documents.update({
  where: { id },
  data: {
    document_type_id,
    title,
    purpose,
    issued_date: issued_date ? new Date(issued_date) : existingDocument.issued_date,
    status,
    pin: pin === undefined ? existingDocument.pin : pin === "true" || pin === true,
    is_public: is_public === undefined ? existingDocument.is_public : is_public === "true" || is_public === true,
    file_url,
    updated_at: new Date(), // 👈 add this
  },
})
    res.status(200).json(documents)
    console.log("Role: staff");
    console.log("Updated document with ID:", documents.id);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }

    console.log(err)
  }
}

/* DELETE */
export const deleteDocuments = async (req: Request, res: Response): Promise<void> => {
  try {

    const existingDocument = await prisma.documents.findUnique({
      where: { id: req.params.id },
    })

    if (!existingDocument) {
      res.status(404).json({ message: "Document not found" })
      return
    }

    if (existingDocument.file_url){
      await deleteFromSupabase({
      bucket: "documents",
      path: existingDocument.file_url,
    })
    }
 

    await prisma.documents.delete({
      where: { id: req.params.id },
    })
    console.log("Role: staff");
    console.log("Document deleted with ID:", req.params.id);
    res.status(200).json({ message: "documents deleted successfully" })
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: "Unknown error occurred" })
    }
  }
}
