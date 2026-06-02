import { supabase } from "../supabase/bucket"

/**
 * Generate a signed URL from a stored Supabase path
 * Returns null if path is invalid or file does not exist
 */
export const generateSignedUrl = async (
  fullPath?: string | null,
  expiresIn = 60 * 5
): Promise<string | null> => {
  try {
    if (!fullPath || !fullPath.includes("/")) {
      return null
    }

    const [bucket, ...pathParts] = fullPath.split("/")
    const filePath = pathParts.join("/")

    if (!bucket || !filePath) return null

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (error || !data?.signedUrl) {
      return null
    }

    return data.signedUrl
  } catch {
    return null
  }
}
