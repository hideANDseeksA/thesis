import { supabase } from "../supabase/bucket"

type DeleteOptions = {
  bucket: string
  path: string // can be "bucket/file" or "folder/file" or "file"
}

export const deleteFromSupabase = async ({
  bucket,
  path,
}: DeleteOptions): Promise<void> => {
  if (!path) return

  // Normalize path inside bucket: remove bucket prefix if exists
  let filePath = path.replace(`${bucket}/`, "").replace(/^\/+/, "")

  if (!filePath) return

  // Optional: debug
  console.log("Deleting from Supabase:", bucket, filePath)

  const { data, error } = await supabase.storage.from(bucket).remove([filePath])

  if (error) throw error
}
