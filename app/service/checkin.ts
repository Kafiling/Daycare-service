import { createClient } from "@/utils/supabase/server";

export interface CheckIn {
  id: string;
  patient_id: string;
  check_in_time: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  created_by?: string;
  created_at: string;
}

export async function checkInPatient(
  patientId: string,
  vitals?: { systolic_bp?: number; diastolic_bp?: number; heart_rate?: number }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('patient_checkins')
    .insert({
      patient_id: patientId,
      created_by: user?.id,
      ...(vitals && {
        systolic_bp: vitals.systolic_bp,
        diastolic_bp: vitals.diastolic_bp,
        heart_rate: vitals.heart_rate
      })
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

export async function updateCheckIn(
  checkInId: string,
  vitals: { systolic_bp?: number; diastolic_bp?: number; heart_rate?: number }
) {
  const supabase = await createClient();

  console.log('Updating check-in with ID:', checkInId);
  console.log('Vitals data:', vitals);

  const { data, error } = await supabase
    .from('patient_checkins')
    .update({
      systolic_bp: vitals.systolic_bp,
      diastolic_bp: vitals.diastolic_bp,
      heart_rate: vitals.heart_rate
    })
    .eq('id', checkInId)
    .select();

  if (error) {
    console.error('Error updating check-in:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.error('No check-in record found with ID:', checkInId);
    throw new Error('Check-in record not found');
  }

  return data[0];
}
