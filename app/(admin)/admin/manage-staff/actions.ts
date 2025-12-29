'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { createUserProfile, updateUserProfile } from '@/app/service/nurse';
import { Profile } from '@/app/service/nurse';
import { requireAdmin } from '../lib/auth';

interface CreateStaffData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  username: string;
  title: string;
  position: string;
}

interface UpdateStaffData {
  first_name: string;
  last_name: string;
  username: string;
  title: string;
  position: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
  profile?: Profile;
}

/**
 * Log staff activity to activity_logs table
 */
async function logStaffActivity(
  activityType: string,
  staffId: string,
  staffName: string,
  performedBy: string,
  metadata?: Record<string, any>
) {
  try {
    const supabase = await createClient();
    
    // Get performer's profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, username')
      .eq('id', performedBy)
      .single();

    const performedByName = profile
      ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username
      : null;

    const descriptions: Record<string, string> = {
      staff_created: `สร้างบัญชีพนักงานใหม่: ${staffName}`,
      staff_updated: `อัปเดตข้อมูลพนักงาน: ${staffName}`,
      staff_password_reset: `รีเซ็ตรหัสผ่านพนักงาน: ${staffName}`,
      staff_deleted: `ลบบัญชีพนักงาน: ${staffName}`,
    };

    await supabase.from('activity_logs').insert({
      activity_type: activityType,
      entity_type: 'staff',
      entity_id: staffId,
      performed_by: performedBy,
      performed_by_name: performedByName,
      description: descriptions[activityType] || `กิจกรรมพนักงาน: ${staffName}`,
      metadata: {
        staff_id: staffId,
        staff_name: staffName,
        ...metadata
      }
    });
  } catch (error) {
    console.error('Error logging staff activity:', error);
    // Don't fail the main operation if logging fails
  }
}

/**
 * Create a new staff member with Supabase Auth and profile
 */
export async function createStaff(data: CreateStaffData): Promise<ActionResult> {
  try {
    // Verify admin privileges
    await requireAdmin();
    
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Create auth user with admin client
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Skip email confirmation for admin-created users
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      return {
        success: false,
        error: createError.message || 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้'
      };
    }

    if (!newUser.user) {
      return { success: false, error: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้' };
    }

    // Create profile in profiles table
    const profileData: Profile = {
      id: newUser.user.id,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      username: data.username || data.email,
      email: data.email,
      title: data.title || null,
      position: data.position || null,
    };

    try {
      const profile = await createUserProfile(profileData);
      if (!profile) {
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(newUser.user.id);
        return { success: false, error: 'เกิดข้อผิดพลาดในการสร้างโปรไฟล์' };
      }

      // Get current user for logging
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logStaffActivity(
          'staff_created',
          newUser.user.id,
          `${data.first_name} ${data.last_name}`.trim() || data.username,
          user.id,
          {
            email: data.email,
            username: data.username,
            title: data.title,
            position: data.position,
          }
        );
      }

      return { success: true, profile };
    } catch (profileError) {
      console.error('Error creating profile:', profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return { success: false, error: 'เกิดข้อผิดพลาดในการสร้างโปรไฟล์พนักงาน' };
    }

  } catch (error) {
    console.error('Error in createStaff:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการสร้างพนักงาน' };
  }
}

/**
 * Update staff member profile information
 */
export async function updateStaff(staffId: string, data: UpdateStaffData): Promise<ActionResult> {
  try {
    // Verify admin privileges
    await requireAdmin();
    
    const supabase = await createClient();

    // Update profile information
    const updatedProfile = await updateUserProfile(staffId, {
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      username: data.username,
      title: data.title || null,
      position: data.position || null,
    });

    if (!updatedProfile) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' };
    }

    // Get current user for logging
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await logStaffActivity(
        'staff_updated',
        staffId,
        `${data.first_name} ${data.last_name}`.trim() || data.username,
        user.id,
        {
          updated_fields: {
            first_name: data.first_name,
            last_name: data.last_name,
            username: data.username,
            title: data.title,
            position: data.position,
          }
        }
      );
    }

    return { success: true, profile: updatedProfile };

  } catch (error) {
    console.error('Error in updateStaff:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน' };
  }
}

/**
 * Reset staff member password
 */
export async function resetStaffPassword(staffId: string, newPassword: string): Promise<ActionResult> {
  try {
    // Verify admin privileges
    await requireAdmin();
    
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Update user password using admin client
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(staffId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return {
        success: false,
        error: updateError.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน'
      };
    }

    // Get staff profile info for logging
    const { data: staffProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, username')
      .eq('id', staffId)
      .single();

    // Get current user for logging
    const { data: { user } } = await supabase.auth.getUser();
    if (user && staffProfile) {
      await logStaffActivity(
        'staff_password_reset',
        staffId,
        `${staffProfile.first_name} ${staffProfile.last_name}`.trim() || staffProfile.username,
        user.id
      );
    }

    return { success: true };

  } catch (error) {
    console.error('Error in resetStaffPassword:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' };
  }
}

/**
 * Delete staff member (both auth user and profile)
 */
export async function deleteStaff(staffId: string): Promise<ActionResult> {
  try {
    // Verify admin privileges
    const { user } = await requireAdmin();
    
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Prevent deleting self
    if (user.id === staffId) {
      return { success: false, error: 'ไม่สามารถลบบัญชีของตนเองได้' };
    }

    // Get staff profile info before deleting for logging
    const { data: staffProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, username, email')
      .eq('id', staffId)
      .single();

    // Delete profile first (due to foreign key constraints)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', staffId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการลบข้อมูลโปรไฟล์'
      };
    }

    // Delete auth user using admin client
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(staffId);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      // Note: Profile is already deleted at this point
      return {
        success: false,
        error: deleteError.message || 'เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้'
      };
    }

    // Log activity after successful deletion
    if (staffProfile) {
      await logStaffActivity(
        'staff_deleted',
        staffId,
        `${staffProfile.first_name} ${staffProfile.last_name}`.trim() || staffProfile.username,
        user.id,
        {
          deleted_email: staffProfile.email,
        }
      );
    }

    return { success: true };

  } catch (error) {
    console.error('Error in deleteStaff:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการลบพนักงาน' };
  }
}
