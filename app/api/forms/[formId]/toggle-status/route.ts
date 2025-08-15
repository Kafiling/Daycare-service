import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// PATCH handler to toggle form active status
export async function PATCH(
    request: Request,
    context: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await context.params;
        const { is_active } = await request.json();
        const supabase = await createClient();

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
            console.error('Error updating form status:', updateError);
            return NextResponse.json(
                { error: 'Failed to update form status', details: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json(updatedForm);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
