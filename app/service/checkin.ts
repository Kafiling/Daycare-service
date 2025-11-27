import { createClient } from "@/utils/supabase/server";

export interface CheckIn {
  id: string;
  patient_id: string;
  check_in_time: string;
  created_by?: string;
  created_at: string;
}

export async function checkInPatient(patientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('patient_checkins')
    .insert({
      patient_id: patientId,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error checking in patient:', error);
    throw error;
  }

  return data;
}

export async function getCheckInHistory(patientId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('patient_checkins')
    .select('*')
    .eq('patient_id', patientId)
    .order('check_in_time', { ascending: false });

  if (error) {
    console.error('Error fetching check-in history:', error);
    throw error;
  }

  return data as CheckIn[];
}

export async function getTodayCheckIn(patientId: string) {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('patient_checkins')
    .select('*')
    .eq('patient_id', patientId)
    .gte('check_in_time', today.toISOString())
    .order('check_in_time', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
    console.error('Error fetching today check-in:', error);
    throw error;
  }

  return data as CheckIn | null;
}
