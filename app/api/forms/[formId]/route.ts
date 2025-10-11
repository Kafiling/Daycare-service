import { createClient, createAdminClient } from '@/utils/supabase/server';
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

        console.log(`Updating form ${formId} with evaluation_thresholds:`, JSON.stringify(formattedThresholds));

        // Update the form base data - use admin client to bypass RLS
        const adminClient = createAdminClient();
        const { data: updateData, error: formUpdateError } = await adminClient
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
            .eq('form_id', formId)
            .select();

        console.log('Update result:', { data: updateData, error: formUpdateError });

        if (formUpdateError) {
            console.error('Error updating form:', formUpdateError);
            return NextResponse.json(
                { error: 'Failed to update form', details: formUpdateError.message },
                { status: 500 }
            );
        }

        console.log(`Form ${formId} updated successfully, verified data:`, JSON.stringify(updateData));

        // Delete existing questions and re-insert new ones
        // Use admin client (already created above) to bypass RLS for deletion

        // First, check what questions exist before deletion
        const { data: existingQuestions, error: checkBeforeError } = await adminClient
            .from('questions')
            .select('question_id, form_id')
            .eq('form_id', formId);

        if (checkBeforeError) {
            console.error('Error checking existing questions:', checkBeforeError);
            return NextResponse.json(
                { error: 'Failed to check existing questions', details: checkBeforeError.message },
                { status: 500 }
            );
        }

        console.log(`Found ${existingQuestions?.length || 0} existing questions before deletion`);

        // Attempt to delete using admin client
        const { data: deletedData, error: questionsDeleteError, count } = await adminClient
            .from('questions')
            .delete({ count: 'exact' })
            .eq('form_id', formId)
            .select();

        console.log(`Delete operation returned: error=${questionsDeleteError}, deletedCount=${deletedData?.length}, count=${count}`);

        if (questionsDeleteError) {
            console.error('Error deleting existing questions:', questionsDeleteError);
            return NextResponse.json(
                { error: 'Failed to delete existing questions', details: questionsDeleteError.message },
                { status: 500 }
            );
        }

        console.log(`Deleted ${deletedData?.length || 0} existing questions for form ${formId}`);

        // Insert new questions with their original question_id from the form
        if (questions && questions.length > 0) {
            // Verify deletion was successful by checking if any questions still exist
            const { data: remainingQuestions, error: checkError } = await adminClient
                .from('questions')
                .select('question_id')
                .eq('form_id', formId);

            if (checkError) {
                console.error('Error checking remaining questions:', checkError);
            } else if (remainingQuestions && remainingQuestions.length > 0) {
                console.warn(`Warning: ${remainingQuestions.length} questions still exist after deletion!`);
                return NextResponse.json(
                    { error: 'Failed to properly delete existing questions', details: `${remainingQuestions.length} questions still remain` },
                    { status: 500 }
                );
            }

            // Get the maximum question_id across ALL forms to ensure uniqueness
            const { data: maxIdData, error: maxIdError } = await supabase
                .from('questions')
                .select('question_id')
                .order('question_id', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (maxIdError) {
                console.error('Error fetching max question_id:', maxIdError);
                return NextResponse.json(
                    { error: 'Failed to get max question_id', details: maxIdError.message },
                    { status: 500 }
                );
            }

            // Start from max + 1, or from 1 if no questions exist yet
            const startId = maxIdData?.question_id ? Number(maxIdData.question_id) + 1 : 1;

            console.log(`Starting question IDs from: ${startId} (max existing ID: ${maxIdData?.question_id || 'none'})`);

            // Map questions with globally unique question_ids
            const formattedQuestions = questions.map((q: any, index: number) => ({
                form_id: formId,
                question_id: startId + index, // Use sequential IDs starting from max + 1
                question_text: q.question_text,
                question_type: q.question_type,
                is_required: q.is_required,
                helper_text: q.helper_text || '',
                options: q.options || {},
                evaluation_scores: q.evaluation_scores || {},
            }));

            console.log(`Inserting ${formattedQuestions.length} new questions with IDs: ${formattedQuestions.map((q: any) => q.question_id).join(', ')}`);

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
