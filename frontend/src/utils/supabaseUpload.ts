import { supabase } from "./supabaseClient";

export async function uploadImageToSupabase(file: File): Promise<string> {
  const bucket = import.meta.env.VITE_SUPABASE_BUCKET || process.env.SUPABASE_BUCKET || "CCIRS";
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  // Get public URL
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  if (!publicUrlData?.publicUrl) throw new Error("Failed to get public URL for image");
  return publicUrlData.publicUrl;
}
