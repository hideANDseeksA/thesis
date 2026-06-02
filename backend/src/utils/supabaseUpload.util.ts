import { supabase } from "../supabase/bucket"

type UploadOptions = {
  bucket: string
  file: Express.Multer.File
  folder?: string
  upsert?: boolean
}

export const uploadToSupabase = async ({
  bucket,
  file,
  folder = "",
  upsert = false,
}: UploadOptions): Promise<string> => {
  /* 1️⃣ Ensure bucket exists */
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets()

  if (listError) throw listError

  const exists = buckets?.some(b => b.name === bucket)

  if (!exists) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: false,
    })
    if (error) throw error
  }

  /* 2️⃣ Build file path */
  const ext = file.originalname.split(".").pop()
  const safeName = file.originalname.replace(/\s+/g, "_")
  const fileName = `${Date.now()}-${safeName}`

  const fullPath = folder
    ? `${folder}/${fileName}`
    : fileName

  /* 3️⃣ Upload */
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fullPath, file.buffer, {
      contentType: file.mimetype,
      upsert,
    })

  if (uploadError) throw uploadError

  return `${bucket}/${fullPath}`
}


