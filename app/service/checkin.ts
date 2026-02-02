import { createClient } from "@/utils/supabase/server";

export interface CheckIn {
  id: string;
  patient_id: string;
  check_in_time: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  created_by?: string;
  created_at: string;
}

export async function checkInPatient(
  patientId: string,
  vitals?: { systolic_bp?: number; diastolic_bp?: number; heart_rate?: number; temperature?: number; weight?: number; height?: number }
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
        heart_rate: vitals.heart_rate,
        temperature: vitals.temperature,
        weight: vitals.weight,
        height: vitals.height
      })
    })
    .select()
    .single();

  if (error) {
    console.error('Error checking in patient:', error);
    throw error;
  }

  // Update patient weight and height if provided
  if (vitals?.weight !== undefined || vitals?.height !== undefined) {
    const updateData: { weight?: number; height?: number } = {};
    if (vitals.weight !== undefined) updateData.weight = vitals.weight;
    if (vitals.height !== undefined) updateData.height = vitals.height;
    
    const { error: updateError } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', patientId);

    if (updateError) {
      console.error('Error updating patient weight/height:', updateError);
    }
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
  patientId: string,
  checkInId: string,
  vitals: { systolic_bp?: number; diastolic_bp?: number; heart_rate?: number; temperature?: number; weight?: number; height?: number }
) {
  const supabase = await createClient();

  console.log('Updating check-in with ID:', checkInId);
  console.log('Vitals data:', vitals);

  const { data, error } = await supabase
    .from('patient_checkins')
    .update({
      systolic_bp: vitals.systolic_bp,
      diastolic_bp: vitals.diastolic_bp,
      heart_rate: vitals.heart_rate,
      temperature: vitals.temperature,
      weight: vitals.weight,
      height: vitals.height
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

  // Update patient weight and height if provided
  if (vitals.weight !== undefined || vitals.height !== undefined) {
    const updateData: { weight?: number; height?: number } = {};
    if (vitals.weight !== undefined) updateData.weight = vitals.weight;
    if (vitals.height !== undefined) updateData.height = vitals.height;
    
    const { error: updateError } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', patientId);

    if (updateError) {
      console.error('Error updating patient weight/height:', updateError);
    }
  }

  return data[0];
}

export async function getLatestCheckInWithVitals(patientId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('patient_checkins')
    .select('weight, height')
    .eq('patient_id', patientId)
    .not('weight', 'is', null)
    .not('height', 'is', null)
    .order('check_in_time', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
    console.error('Error fetching latest check-in vitals:', error);
    return null;
  }

  return data as { weight?: number; height?: number } | null;
}
