"use server";
import { createClient } from "@/utils/supabase/server";

export interface PatientSearchResult {
  id: string;
  title?: string;
  first_name: string;
  last_name: string;
  phone_num?: string;
  postal_num?: string;
  address?: string;
  road?: string;
  sub_district?: string;
  district?: string;
  province?: string;
  caregiver_name?: string;
  date_of_birth?: string;
  profile_image_url?: string;
  deleted_at?: string;
  scheduled_permanent_delete_at?: string;
  matchedFields: string[]; // Which fields matched the search
}

export async function searchPatients(searchQuery: string): Promise<PatientSearchResult[]> {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }

  const supabase = await createClient();
  const search = searchQuery.trim();

  // Use ilike for case-insensitive partial matching
  const { data, error } = await supabase
    .from("patients")
    .select(`
      id,
      title,
      first_name,
      last_name,
      phone_num,
      postal_num,
      address,
      road,
      sub_district,
      district,
      province,
      caregiver_name,
      date_of_birth,
      profile_image_url,
      deleted_at,
      scheduled_permanent_delete_at
    `)
    .is('deleted_at', null)
    .or(`id.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_num.ilike.%${search}%,postal_num.ilike.%${search}%,caregiver_name.ilike.%${search}%,address.ilike.%${search}%,road.ilike.%${search}%,sub_district.ilike.%${search}%,district.ilike.%${search}%,province.ilike.%${search}%`)
    .limit(10)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error searching patients:", error);
    return [];
  }

  // Determine which fields matched for each patient
  return (data || []).map(patient => {
    const matchedFields: string[] = [];
    const lowerSearch = search.toLowerCase();

    if (patient.id.toLowerCase().includes(lowerSearch)) matchedFields.push('id');
    if (patient.first_name.toLowerCase().includes(lowerSearch)) matchedFields.push('first_name');
    if (patient.last_name.toLowerCase().includes(lowerSearch)) matchedFields.push('last_name');
    if (patient.phone_num?.toLowerCase().includes(lowerSearch)) matchedFields.push('phone_num');
    if (patient.postal_num?.toLowerCase().includes(lowerSearch)) matchedFields.push('postal_num');
    if (patient.caregiver_name?.toLowerCase().includes(lowerSearch)) matchedFields.push('caregiver_name');
    if (patient.address?.toLowerCase().includes(lowerSearch)) matchedFields.push('address');
    if (patient.road?.toLowerCase().includes(lowerSearch)) matchedFields.push('road');
    if (patient.sub_district?.toLowerCase().includes(lowerSearch)) matchedFields.push('sub_district');
    if (patient.district?.toLowerCase().includes(lowerSearch)) matchedFields.push('district');
    if (patient.province?.toLowerCase().includes(lowerSearch)) matchedFields.push('province');

    return {
      ...patient,
      matchedFields,
    };
  });
}

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
