import { supabase } from "../supabase/bucket"

type UpdateOptions = {
  bucket: string
  file: Express.Multer.File
  oldPath?: string | null
  folder?: string
}
export const updateSupabaseFile = async ({
  bucket,
  file,
  oldPath,
  folder = "",
}: UpdateOptions): Promise<string> => {

  /* 1️⃣ Normalize old path */
  if (oldPath) {
    const normalizedPath = oldPath.replace(`${bucket}/`, "")

    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([normalizedPath])

    if (deleteError) {
      console.error("Failed to delete old file:", deleteError)
    }
  }

  /* 2️⃣ Build new file path */
  const safeName = file.originalname.replace(/\s+/g, "_")
  const fileName = `${Date.now()}-${safeName}`

  const fullPath = folder
    ? `${folder}/${fileName}`
    : fileName

  /* 3️⃣ Upload new file */
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fullPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (uploadError) throw uploadError

  return `${bucket}/${fullPath}`
}
