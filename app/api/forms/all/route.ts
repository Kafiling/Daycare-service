import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';

// GET handler to fetch ALL forms (both active and inactive) for admin panel
export async function GET() {
    try {
        // Use admin client to bypass RLS and get all forms
        const supabase = await createAdminClient();
        
        // Verify user is authenticated
        const authClient = await createClient();
        const { data: { user }, error: userError } = await authClient.auth.getUser();
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. You must be logged in to view forms.' },
                { status: 401 }
            );
        }

        console.log('[Get All Forms] Fetching all forms (active and inactive)...');

        // Fetch all forms without filtering by is_active
        const { data: forms, error: formsError } = await supabase
            .from('forms')
            .select('*')
            .order('created_at', { ascending: false });

        if (formsError) {
            console.error('[Get All Forms] Error fetching forms:', formsError);
            return NextResponse.json(
                { error: 'Failed to fetch forms', details: formsError.message },
                { status: 500 }
            );
        }

        console.log(`[Get All Forms] Successfully fetched ${forms?.length || 0} forms`);

        return NextResponse.json(forms || []);
    } catch (error) {
        console.error('[Get All Forms] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
