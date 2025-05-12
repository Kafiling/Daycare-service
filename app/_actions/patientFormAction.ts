'use server'
import { createClient } from "@/utils/supabase/server";

export async function searchPatientByID(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();
    
    if (error) {
        console.error("Error fetching patient:", error);
        return null;
    }
    
    return data;
    }

    