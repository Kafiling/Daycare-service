import { createClient } from "@/utils/supabase/client";

// Types based on your database schema
export interface Patient {
    id: string;
    title?: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone_num?: string;
    email?: string;
    weight?: number;
    height?: number;
    address?: string;
    road?: string;
    sub_district?: string;
    district?: string;
    province?: string;
    postal_num?: string;
    created_at: string;
    updated_at: string;
    image_url?: string;
}

export interface Form {
    id: number;
    title: string;
    description?: string;
    created_by?: string;
    version: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Question {
    id: number;
    form_id: number;
    question_text: string;
    question_type: string;
    options?: any;
    is_required: boolean;
    helper_text?: string;
    created_at: string;
    updated_at: string;
}

export interface FormResponse {
    id: string;
    patient_id: string;
    form_id: number;
    nurse_id: string;
    submitted_at: string;
    status?: string;
    notes?: string;
}

export interface QuestionAnswer {
    id: string;
    submission_id: string;
    question_id: number;
    form_id: number;
    answer_value: any;
    answered_at: string;
}

/**
 * Get patient by ID
 */
export async function getPatientById(patientId: string): Promise<Patient | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

    if (error) {
        console.error('Error fetching patient:', error);
        throw new Error(`Failed to fetch patient: ${error.message}`);
    }

    return data;
}

/**
 * Get all active forms
 */
export async function getActiveForms(): Promise<Form[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching forms:', error);
        throw new Error(`Failed to fetch forms: ${error.message}`);
    }

    return data || [];
}

/**
 * Get form by ID
 */
export async function getFormById(formId: number): Promise<Form | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error fetching form:', error);
        throw new Error(`Failed to fetch form: ${error.message}`);
    }

    return data;
}

/**
 * Get all questions for a form
 */
export async function getQuestionsByFormId(formId: number): Promise<Question[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching questions:', error);
        throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    return data || [];
}

/**
 * Get specific question by ID and form ID
 */
export async function getQuestionById(questionId: number, formId: number): Promise<Question | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .eq('form_id', formId)
        .single();

    if (error) {
        console.error('Error fetching question:', error);
        throw new Error(`Failed to fetch question: ${error.message}`);
    }

    return data;
}

/**
 * Get completed form submissions for a patient
 */
export async function getPatientFormResponses(patientId: string): Promise<FormResponse[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('submissions')
        .select(`
      *,
      forms (
        id,
        title,
        description
      )
    `)
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Error fetching form responses:', error);
        throw new Error(`Failed to fetch form responses: ${error.message}`);
    }

    return data || [];
}

/**
 * Create a new form submission (when starting a survey)
 */
export async function createFormResponse(patientId: string, formId: number, nurseId: string): Promise<string> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('submissions')
        .insert({
            patient_id: patientId,
            form_id: formId,
            nurse_id: nurseId,
            status: 'in_progress',
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating form response:', error);
        throw new Error(`Failed to create form response: ${error.message}`);
    }

    return data.id;
}

/**
 * Save answer for a question
 */
export async function saveQuestionAnswer(submissionId: string, questionId: number, formId: number, answerValue: any): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('answers')
        .upsert({
            submission_id: submissionId,
            question_id: questionId,
            form_id: formId,
            answer_value: answerValue,
        }, {
            onConflict: 'submission_id,question_id'
        });

    if (error) {
        console.error('Error saving answer:', error);
        throw new Error(`Failed to save answer: ${error.message}`);
    }
}

/**
 * Get answers for a submission
 */
export async function getFormResponseAnswers(submissionId: string): Promise<Record<number, any>> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('answers')
        .select('question_id, answer_value')
        .eq('submission_id', submissionId);

    if (error) {
        console.error('Error fetching answers:', error);
        throw new Error(`Failed to fetch answers: ${error.message}`);
    }

    const answers: Record<number, any> = {};
    data?.forEach(answer => {
        answers[answer.question_id] = answer.answer_value;
    });

    return answers;
}

/**
 * Complete a submission with final notes
 */
export async function completeFormResponse(
    submissionId: string,
    notes?: string,
    nurseId?: string
): Promise<void> {
    const supabase = createClient();

    const updateData: any = {
        status: 'completed',
        submitted_at: new Date().toISOString(),
    };

    if (notes) updateData.notes = notes;
    if (nurseId) updateData.nurse_id = nurseId;

    const { error } = await supabase
        .from('submissions')
        .update(updateData)
        .eq('id', submissionId);

    if (error) {
        console.error('Error completing form response:', error);
        throw new Error(`Failed to complete form response: ${error.message}`);
    }
}

/**
 * Update submission as draft
 */
export async function saveDraftFormResponse(submissionId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('submissions')
        .update({
            submitted_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

    if (error) {
        console.error('Error saving draft:', error);
        throw new Error(`Failed to save draft: ${error.message}`);
    }
}

/**
 * Get or create a submission for a patient and form
 */
export async function getOrCreateFormResponse(patientId: string, formId: number, nurseId: string): Promise<string> {
    const supabase = createClient();

    // First, check if there's an existing in-progress submission
    const { data: existingSubmission, error: fetchError } = await supabase
        .from('submissions')
        .select('id')
        .eq('patient_id', patientId)
        .eq('form_id', formId)
        .eq('status', 'in_progress')
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing submission:', fetchError);
        throw new Error(`Failed to check existing submission: ${fetchError.message}`);
    }

    if (existingSubmission) {
        return existingSubmission.id;
    }

    // Create new submission if none exists
    return await createFormResponse(patientId, formId, nurseId);
}

/**
 * Get the first question of a form
 */
export async function getFirstQuestionByFormId(formId: number): Promise<Question | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('id', { ascending: true })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching first question:', error);
        return null; // Return null instead of throwing error since this is for navigation
    }

    return data;
}
