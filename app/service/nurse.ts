import { createClient } from "@/utils/supabase/server";

/**
 * Interface for nurse/staff profile from the profiles table
 */
export interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string;
    email: string;
    title: string | null; // Name prefix (นาย,นาง,นางสาว,นายแพทย์ etc.)
    position: string | null; // Job role/position
}

/**
 * Get user profile by auth user ID
 * This is used for nurses/staff authentication and profile display
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.log('Error fetching user profile:', error);
        if (error.code === 'PGRST116') {
            return null; // Profile not found
        }
        throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
    userId: string,
    updates: Partial<Omit<Profile, 'id'>>
): Promise<Profile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .single();

    if (error) {
        console.error('Error updating user profile:', error);
        throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return data;
}

/**
 * Create a new user profile
 */
export async function createUserProfile(profile: Profile): Promise<Profile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select('*')
        .single();

    if (error) {
        console.error('Error creating user profile:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return data;
}

/**
 * Get all staff/nurse profiles (for admin purposes)
 */
export async function getAllStaffProfiles(): Promise<Profile[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name', { ascending: true });

    if (error) {
        console.error('Error fetching staff profiles:', error);
        throw new Error(`Failed to fetch staff profiles: ${error.message}`);
    }

    return data || [];
}
