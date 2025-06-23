"use server";
import { createClient } from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Upload file using standard upload
export async function uploadImage(base64: string, patientId: string) {
  const { data, error } = await supabase.storage
    .from("patient-image")
    .upload(`${patientId}.png`, decode(base64), {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from("patient-image")
    .getPublicUrl(data.path);

  if (!publicUrlData) {
    throw new Error("Failed to get public URL for the uploaded image.");
  }

  return publicUrlData.publicUrl;
}
