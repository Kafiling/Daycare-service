import { createClient } from "@/utils/supabase/client";

/**
 * Interface for nurse/staff profile from the profiles table (client-side)
 */
export interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string;
    email: string;
    title: string | null; // Name prefix (Mr., Ms., Dr., etc.)
    position: string | null; // Job role/position
}

/**
 * Get current authenticated user profile (client-side)
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
    const supabase = createClient();

    // First get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('Error getting auth user:', authError);
        return null;
    }

    // Then get their profile
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        if (error.code === 'PGRST116') {
            return null; // Profile not found
        }
        throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data;
}

/**
 * Get user profile by user ID (client-side)
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        if (error.code === 'PGRST116') {
            return null; // Profile not found
        }
        throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data;
}
