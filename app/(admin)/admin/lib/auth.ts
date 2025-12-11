import { createClient } from "@/utils/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('position')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.position !== 'ผู้ดูแลระบบ') {
    throw new Error('Forbidden: User is not an administrator');
  }

  return { user, profile };
}
