import { createClient, createAdminClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// PATCH handler to toggle form active status
export async function PATCH(
    request: Request,
    context: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await context.params;
        const { is_active } = await request.json();
        
        console.log(`[Toggle Status] Toggling form ${formId} to is_active=${is_active}`);
        
        // Use admin client to bypass RLS
        const supabase = await createAdminClient();
        
        // Verify user is authenticated (optional, but good for security)
        const authClient = await createClient();
        const { data: { user }, error: userError } = await authClient.auth.getUser();
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. You must be logged in to update forms.' },
                { status: 401 }
            );
        }

        // Update the form status
        const { data: updatedForm, error: updateError } = await supabase
            .from('forms')
            .update({
                is_active: is_active,
                updated_at: new Date().toISOString()
            })
            .eq('form_id', formId)
            .select('*')
            .single();

        if (updateError) {
            console.error('[Toggle Status] Error updating form status:', updateError);
            return NextResponse.json(
                { error: 'Failed to update form status', details: updateError.message },
                { status: 500 }
            );
        }

        console.log(`[Toggle Status] Successfully toggled form ${formId} to is_active=${updatedForm.is_active}`);
        
        return NextResponse.json(updatedForm);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
