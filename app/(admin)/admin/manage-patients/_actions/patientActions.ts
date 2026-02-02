'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface PatientListItem {
  id: string;
  title?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  phone_num?: string;
  email?: string;
  created_at: string;
  deleted_at?: string;
  scheduled_permanent_delete_at?: string;
  group_id?: string;
}

export async function getAllPatients(searchQuery?: string): Promise<PatientListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from('patients')
    .select(`
      id,
      title,
      first_name,
      last_name,
      date_of_birth,
      phone_num,
      email,
      created_at,
      deleted_at,
      group_id
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Add search filter if provided
  if (searchQuery && searchQuery.trim() !== '') {
    const search = searchQuery.trim();
    query = query.or(`id.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_num.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }

  return (data || []).map(patient => ({
    ...patient,
    full_name: `${patient.title || ''}${patient.first_name} ${patient.last_name}`.trim()
  }));
}

export async function softDeletePatient(patientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('patients')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id
    })
    .eq('id', patientId)
    .is('deleted_at', null);

  if (error) {
    console.error('Error soft deleting patient:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/manage-patients');
  return { success: true };
}

export async function restorePatient(patientId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('patients')
    .update({
      deleted_at: null,
      deleted_by: null,
      scheduled_permanent_delete_at: null
    })
    .eq('id', patientId);

  if (error) {
    console.error('Error restoring patient:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/manage-patients');
  return { success: true };
}

export async function getDeletedPatients(): Promise<PatientListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('patients')
    .select(`
      id,
      title,
      first_name,
      last_name,
      date_of_birth,
      phone_num,
      email,
      created_at,
      deleted_at,
      scheduled_permanent_delete_at,
      group_id
    `)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    console.error('Error fetching deleted patients:', error);
    throw error;
  }

  return (data || []).map(patient => ({
    ...patient,
    full_name: `${patient.title || ''}${patient.first_name} ${patient.last_name}`.trim()
  }));
}
