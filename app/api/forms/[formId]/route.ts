import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// GET handler to fetch a form by its ID
export async function GET(
    request: Request,
    context: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await context.params;
        const supabase = await createClient();

        // Fetch form details
        const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('form_id', formId)
            .single();

        if (formError) {
            console.error('Error fetching form:', formError);
            return NextResponse.json(
                { error: 'Failed to fetch form', details: formError.message },
                { status: 500 }
            );
        }

        if (!formData) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            );
        }

        // Fetch form questions
        const { data: questionsData, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('form_id', formId)
            .order('question_id', { ascending: true });

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json(
                { error: 'Failed to fetch form questions', details: questionsError.message },
                { status: 500 }
            );
        }

        // Get evaluation thresholds from the form data
        let formattedThresholds: Array<{
            minScore: number;
            maxScore: number;
            result: string;
            description: string;
        }> = [];
        
        if (formData.evaluation_thresholds) {
            // Parse if it's a string, or use directly if it's already an object
            let thresholds = typeof formData.evaluation_thresholds === 'string' 
                ? JSON.parse(formData.evaluation_thresholds) 
                : formData.evaluation_thresholds;
                
            // Format thresholds for the UI
            formattedThresholds = Array.isArray(thresholds) ? thresholds.map(threshold => ({
                minScore: threshold.min_score || threshold.minScore,
                maxScore: threshold.max_score || threshold.maxScore,
                result: threshold.result,
                description: threshold.description
            })) : [];
        }

        // Combine all data for response
        const responseData = {
            ...formData,
            questions: questionsData,
            evaluation_thresholds: formattedThresholds
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// PUT handler to update a form
export async function PUT(
    request: Request,
    context: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await context.params;
        const formData = await request.json();
        const supabase = await createClient();

        // Extract form base data
        const {
            title,
            description,
            label,
            time_to_complete,
            priority_level,
            is_active,
            evaluation_thresholds,
            questions
        } = formData;

        // Format evaluation thresholds for saving in the forms table
        const formattedThresholds = evaluation_thresholds ? evaluation_thresholds.map((t: any) => ({
          min_score: t.minScore,
          max_score: t.maxScore,
          result: t.result,
          description: t.description || "",
        })) : [];

        // Update the form base data
        const { error: formUpdateError } = await supabase
            .from('forms')
            .update({
                title,
                description,
                label,
                time_to_complete,
                priority_level,
                is_active,
                evaluation_thresholds: formattedThresholds,
                updated_at: new Date().toISOString()
            })
            .eq('form_id', formId);

        if (formUpdateError) {
            console.error('Error updating form:', formUpdateError);
            return NextResponse.json(
                { error: 'Failed to update form', details: formUpdateError.message },
                { status: 500 }
            );
        }

        // Delete existing questions and re-insert new ones
        // This is simpler than trying to update/insert/delete individual questions
        const { error: questionsDeleteError } = await supabase
            .from('questions')
            .delete()
            .eq('form_id', formId);

        if (questionsDeleteError) {
            console.error('Error deleting existing questions:', questionsDeleteError);
            return NextResponse.json(
                { error: 'Failed to update form questions', details: questionsDeleteError.message },
                { status: 500 }
            );
        }

        // Insert new questions
        if (questions && questions.length > 0) {
            const formattedQuestions = questions.map((q: any) => ({
                form_id: formId,
                question_id: q.question_id,
                question_text: q.question_text,
                question_type: q.question_type,
                is_required: q.is_required,
                helper_text: q.helper_text || '',
                options: q.options || {},
            }));

            const { error: questionsInsertError } = await supabase
                .from('questions')
                .insert(formattedQuestions);

            if (questionsInsertError) {
                console.error('Error inserting new questions:', questionsInsertError);
                return NextResponse.json(
                    { error: 'Failed to update form questions', details: questionsInsertError.message },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true, message: 'Form updated successfully' });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

// DELETE handler to delete a form
export async function DELETE(
    request: Request,
    context: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await context.params;
        const supabase = await createClient();

        // First, delete form questions
        const { error: questionsDeleteError } = await supabase
            .from('questions')
            .delete()
            .eq('form_id', formId);

        if (questionsDeleteError) {
            console.error('Error deleting questions:', questionsDeleteError);
            return NextResponse.json(
                { error: 'Failed to delete form questions', details: questionsDeleteError.message },
                { status: 500 }
            );
        }

        // Finally, delete the form itself
        const { error: formDeleteError } = await supabase
            .from('forms')
            .delete()
            .eq('form_id', formId);

        if (formDeleteError) {
            console.error('Error deleting form:', formDeleteError);
            return NextResponse.json(
                { error: 'Failed to delete form', details: formDeleteError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Form deleted successfully' });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
