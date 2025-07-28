'use server';

import { createClient } from '@/utils/supabase/server';
import { createUserProfile, updateUserProfile } from '@/app/service/nurse';
import { Profile } from '@/app/service/nurse';

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
 * Create a new staff member with Supabase Auth and profile
 */
export async function createStaff(data: CreateStaffData): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Check if current user is authorized (you might want to add admin role check here)
    const { data: currentUser, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser?.user) {
      return { success: false, error: 'ไม่มีสิทธิ์ในการดำเนินการ' };
    }

    // Create auth user with admin API
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
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
    const supabase = await createClient();

    // Check if current user is authorized
    const { data: currentUser, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser?.user) {
      return { success: false, error: 'ไม่มีสิทธิ์ในการดำเนินการ' };
    }

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
    const supabase = await createClient();

    // Check if current user is authorized
    const { data: currentUser, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser?.user) {
      return { success: false, error: 'ไม่มีสิทธิ์ในการดำเนินการ' };
    }

    // Update user password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(staffId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return {
        success: false,
        error: updateError.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน'
      };
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
    const supabase = await createClient();

    // Check if current user is authorized
    const { data: currentUser, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser?.user) {
      return { success: false, error: 'ไม่มีสิทธิ์ในการดำเนินการ' };
    }

    // Prevent deleting self
    if (currentUser.user.id === staffId) {
      return { success: false, error: 'ไม่สามารถลบบัญชีของตนเองได้' };
    }

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

    // Delete auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(staffId);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      // Note: Profile is already deleted at this point
      return {
        success: false,
        error: deleteError.message || 'เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error in deleteStaff:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการลบพนักงาน' };
  }
}
