"use server";
import { createClient } from "@/utils/supabase/server";

export async function searchPatientByID(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code === "PGRST116") {
    //No patient found -> Page will show modal to create new patient
    return data;
    //throw new Error("No patient found");  
  }
  if (error) {
    console.error("Error fetching patient:", error);
    throw new Error("Error fetching patient", error);
  }

  // Check if patient is soft deleted
  if (data && data.deleted_at) {
    // Return special object indicating patient is soft deleted
    return {
      ...data,
      isSoftDeleted: true,
    };
  }

  return data;
}
