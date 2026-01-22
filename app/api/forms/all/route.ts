import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';

// GET handler to fetch ALL forms (both active and inactive) for admin panel
export async function GET() {
    try {
        // Use regular client for auth check and query (RLS will handle permissions)
        const supabase = await createClient();
        
        // Verify user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. You must be logged in to view forms.' },
                { status: 401 }
            );
        }

        console.log('[Get All Forms] Fetching all forms (active and inactive)...');

        // Fetch forms with only needed fields for better performance
        const { data: forms, error: formsError } = await supabase
            .from('forms')
            .select('form_id, title, description, label, time_to_complete, priority_level, version, is_active, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (formsError) {
            console.error('[Get All Forms] Error fetching forms:', formsError);
            return NextResponse.json(
                { error: 'Failed to fetch forms', details: formsError.message },
                { status: 500 }
            );
        }

        console.log(`[Get All Forms] Successfully fetched ${forms?.length || 0} forms`);

        // Add cache headers for better performance (cache for 30 seconds)
        return NextResponse.json(forms || [], {
            headers: {
                'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
            },
        });
    } catch (error) {
        console.error('[Get All Forms] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
