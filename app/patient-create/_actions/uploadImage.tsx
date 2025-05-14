import { createClient } from "@supabase/supabase-js";
// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// Upload file using standard upload
export async function uploadImage(imageUrl: string) {
  const { data, error } = await supabase.storage
    .from("patient-image")
    .upload("test", imageUrl, {
      upsert: true,
    });
  return { data, error };
}
