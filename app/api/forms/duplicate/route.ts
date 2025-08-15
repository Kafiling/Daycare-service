import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// POST handler to duplicate a form
export async function POST(request: Request) {
    try {
        const formData = await request.json();
        const supabase = await createClient();

        // Get user information
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. You must be logged in to duplicate a form.' },
                { status: 401 }
            );
        }

        // Generate a new form ID
        const newFormId = randomUUID();

        // Extract form base data (excluding form_id and timestamps)
        const {
            title,
            description,
            label,
            time_to_complete,
            priority_level,
            evaluation_thresholds,
            form_id: originalFormId,
        } = formData;

        // Insert the new form
        const { data: newForm, error: formError } = await supabase
            .from('forms')
            .insert({
                form_id: newFormId,
                title,
                description,
                label,
                time_to_complete,
                priority_level,
                created_by: user.id,
                is_active: true,
                // If evaluation_thresholds exists in the original form, include it
                ...(evaluation_thresholds && { evaluation_thresholds }),
            })
            .select()
            .single();

        if (formError) {
            console.error('Error duplicating form:', formError);
            return NextResponse.json(
                { error: 'Failed to duplicate form', details: formError.message },
                { status: 500 }
            );
        }

        // Fetch the original form's questions
        const { data: originalQuestions, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('form_id', originalFormId)
            .order('question_id', { ascending: true });

        if (questionsError) {
            console.error('Error fetching original questions:', questionsError);
            // Rollback by deleting the new form
            await supabase.from('forms').delete().eq('form_id', newFormId);
            return NextResponse.json(
                { error: 'Failed to fetch original questions', details: questionsError.message },
                { status: 500 }
            );
        }

        // Insert the questions for the new form
        if (originalQuestions && originalQuestions.length > 0) {
            const newQuestions = originalQuestions.map(q => ({
                form_id: newFormId,
                question_id: q.question_id,
                question_text: q.question_text,
                question_type: q.question_type,
                is_required: q.is_required,
                helper_text: q.helper_text || '',
                options: q.options || {}
            }));

            const { error: insertQuestionsError } = await supabase
                .from('questions')
                .insert(newQuestions);

            if (insertQuestionsError) {
                console.error('Error inserting new questions:', insertQuestionsError);
                // Rollback by deleting the new form
                await supabase.from('forms').delete().eq('form_id', newFormId);
                return NextResponse.json(
                    { error: 'Failed to insert new questions', details: insertQuestionsError.message },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            ...newForm,
            message: 'Form duplicated successfully'
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
