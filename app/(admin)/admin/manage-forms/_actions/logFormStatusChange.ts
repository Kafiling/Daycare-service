'use server';

import { createClient } from '@/utils/supabase/server';

export async function logFormStatusChange(
  formId: string,
  formTitle: string,
  isActive: boolean
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
        activity_type: isActive ? 'survey_activated' : 'survey_deactivated',
        entity_type: 'survey',
        entity_id: formId,
        performed_by: user.id,
        performed_by_name: performedByName,
        description: `${isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}แบบสอบถาม: ${formTitle}`,
        metadata: {
          survey_id: formId,
          title: formTitle,
          is_active: isActive,
          changed_by: user.id
        }
      });

    if (insertError) {
      console.error('Error logging form status change:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logFormStatusChange:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
