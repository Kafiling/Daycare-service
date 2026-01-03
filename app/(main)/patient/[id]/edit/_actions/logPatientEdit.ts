'use server';

import { createClient } from '@/utils/supabase/server';

export async function logPatientEdit(
  patientId: string,
  patientName: string,
  changes?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, username')
      .eq('id', user.id)
      .single();

    const performedByName = profile
      ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username
      : null;

    // Insert activity log
    const { error: insertError } = await supabase
      .from('activity_logs')
      .insert({
        activity_type: 'patient_updated',
        entity_type: 'patient',
        entity_id: patientId,
        performed_by: user.id,
        performed_by_name: performedByName,
        description: `อัปเดตข้อมูลผู้ใช้บริการ: ${patientName}`,
        metadata: {
          patient_id: patientId,
          patient_name: patientName,
          updated_by: user.id,
          changes: changes || {}
        }
      });

    if (insertError) {
      console.error('Error logging patient edit:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logPatientEdit:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
