import { createClient } from "@/utils/supabase/server";

// Types based on your database schema
export interface Patient {
    id: string;
    title: string;
    first_name: string;
    last_name: string;
    full_name: string;
    date_of_birth: string;
    birth_date: string;
    phone_num: string;
    phone: string;
    email?: string;
    gender?: string;
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
    profile_image_url?: string;
    caregiver_name?: string;
    media_consent?: boolean;
    transportation?: string;
    parking_requirement?: boolean;
    distance_from_home?: number;
    marital_status?: string;
    education_level?: string;
    fall_history?: boolean;
    underlying_diseases?: string[];
    hospitalization_history?: boolean;
    deleted_at?: string;
    deleted_by?: string;
    scheduled_permanent_delete_at?: string;
}

export interface Form {
    form_id: string;
    title: string;
    description?: string;
    label?: string;
    time_to_complete?: number;
    priority_level?: string;
    created_by?: string;
    version: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    recurrence_schedule?: number[];
}

export interface Question {
    question_id: number;
    form_id: string;
    question_text: string;
    question_type: string;
    options?: any;
    is_required: boolean;
    helper_text?: string;
    created_at: string;
    updated_at: string;
}

export interface FormResponse {
    id: number;
    patient_id: string;
    form_id: string;
    completed_by?: string;
    completed_at: string;
    score?: number;
    status: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface FormSubmissionWithForm {
    id: number;
    patient_id: string;
    form_id: string;
    submitted_at: string;
    status?: string;
    notes?: string;
    total_evaluation_score?: number;
    evaluation_result?: string;
    evaluation_description?: string;
    form: {
        form_id: string;
        title: string;
        description?: string;
        label?: string;
        time_to_complete?: number;
        priority_level?: 'low' | 'medium' | 'high';
    };
}

export interface QuestionAnswer {
    id: number;
    response_id: number;
    question_id: number;
    answer_value: string;
    created_at: string;
}



/**
 * Get patient by ID
 */
export async function getPatientById(patientId: string): Promise<Patient | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

    if (error) {
        console.error('Error fetching patient:', error);
        if (error.code === 'PGRST116') {
            return null; // Patient not found
        }
        throw new Error(`Failed to fetch patient: ${error.message}`);
    }

    if (!data) return null;

    // Map database fields to our interface, handling both old and new field names
    return {
        id: data.id,
        title: data.title || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        full_name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        date_of_birth: data.date_of_birth || data.birth_date || '',
        birth_date: data.birth_date || data.date_of_birth || '',
        phone_num: data.phone_num || data.phone || '',
        phone: data.phone || data.phone_num || '',
        email: data.email || '',
        gender: data.gender || '',
        weight: data.weight,
        height: data.height,
        address: data.address,
        road: data.road,
        sub_district: data.sub_district,
        district: data.district,
        province: data.province,
        postal_num: data.postal_num,
        created_at: data.created_at,
        updated_at: data.updated_at,
        profile_image_url: data.profile_image_url,
        caregiver_name: data.caregiver_name,
        media_consent: data.media_consent,
        transportation: data.transportation,
        parking_requirement: data.parking_requirement,
        distance_from_home: data.distance_from_home,
        marital_status: data.marital_status,
        education_level: data.education_level,
        fall_history: data.fall_history,
        underlying_diseases: data.underlying_diseases,
        hospitalization_history: data.hospitalization_history
    };
}

/**
 * Get all active forms
 */
export async function getActiveForms(): Promise<Form[]> {
    const supabase = await createClient();

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
export async function getFormById(formId: string): Promise<Form | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('form_id', formId)
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
export async function getQuestionsByFormId(formId: string): Promise<Question[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('question_id', { ascending: true });

    if (error) {
        console.error('Error fetching questions:', error);
        throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    return data || [];
}

/**
 * Get specific question by ID and form ID
 */
export async function getQuestionById(questionId: number, formId: string): Promise<Question | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('question_id', questionId)
        .eq('form_id', formId)
        .single();

    if (error) {
        console.error('Error fetching question:', error);
        throw new Error(`Failed to fetch question: ${error.message}`);
    }

    return data;
}

/**
 * Get completed form responses for a patient with form details
 */
export async function getCompletedSubmissions(patientId: string): Promise<FormSubmissionWithForm[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('submissions')
        .select(`
      id,
      patient_id,
      form_id,
      submitted_at,
      status,
      notes,
      total_evaluation_score,
      evaluation_result,
      evaluation_description,
      forms (
        form_id,
        title,
        description,
        label,
        time_to_complete,
        priority_level
      )
    `)
        .eq('patient_id', patientId)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Error fetching completed submissions:', error);
        throw new Error(`Failed to fetch completed submissions: ${error.message}`);
    }

    return data?.map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        form_id: item.form_id,
        submitted_at: item.submitted_at,
        status: item.status,
        notes: item.notes,
        total_evaluation_score: item.total_evaluation_score,
        evaluation_result: item.evaluation_result,
        evaluation_description: item.evaluation_description,
        form: Array.isArray(item.forms) ? item.forms[0] : item.forms
    })).filter(item => item.form) || [];
}

/**
 * Create a new form response (when starting a survey)
 */
export async function createFormResponse(patientId: string, formId: string, completedBy?: string): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('form_responses')
        .insert({
            patient_id: patientId,
            form_id: formId,
            completed_by: completedBy,
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
export async function saveQuestionAnswer(responseId: number, questionId: number, answerValue: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('question_answers')
        .upsert({
            response_id: responseId,
            question_id: questionId,
            answer_value: answerValue,
        }, {
            onConflict: 'response_id,question_id'
        });

    if (error) {
        console.error('Error saving answer:', error);
        throw new Error(`Failed to save answer: ${error.message}`);
    }
}

/**
 * Get answers for a form response
 */
export async function getFormResponseAnswers(responseId: number): Promise<Record<number, string>> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('question_answers')
        .select('question_id, answer_value')
        .eq('response_id', responseId);

    if (error) {
        console.error('Error fetching answers:', error);
        throw new Error(`Failed to fetch answers: ${error.message}`);
    }

    const answers: Record<number, string> = {};
    data?.forEach(answer => {
        answers[answer.question_id] = answer.answer_value;
    });

    return answers;
}

/**
 * Complete a form response with final score and notes
 */
export async function completeFormResponse(
    responseId: number,
    score?: number,
    notes?: string,
    completedBy?: string
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('form_responses')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            score: score,
            notes: notes,
            completed_by: completedBy,
        })
        .eq('id', responseId);

    if (error) {
        console.error('Error completing form response:', error);
        throw new Error(`Failed to complete form response: ${error.message}`);
    }
}

/**
 * Update form response as draft
 */
export async function saveDraftFormResponse(responseId: number): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('form_responses')
        .update({
            updated_at: new Date().toISOString(),
        })
        .eq('id', responseId);

    if (error) {
        console.error('Error saving draft:', error);
        throw new Error(`Failed to save draft: ${error.message}`);
    }
}

/**
 * Get or create a form response for a patient and form
 */
export async function getOrCreateFormResponse(patientId: string, formId: string, completedBy?: string): Promise<number> {
    const supabase = await createClient();

    // First, check if there's an existing in-progress response
    const { data: existingResponse, error: fetchError } = await supabase
        .from('form_responses')
        .select('id')
        .eq('patient_id', patientId)
        .eq('form_id', formId)
        .eq('status', 'in_progress')
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing response:', fetchError);
        throw new Error(`Failed to check existing response: ${fetchError.message}`);
    }

    if (existingResponse) {
        return existingResponse.id;
    }

    // Create new response if none exists
    return await createFormResponse(patientId, formId, completedBy);
}

/**
 * Get the first question of a form
 */
export async function getFirstQuestionByFormId(formId: string): Promise<Question | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('question_id', { ascending: true })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching first question:', error);
        return null; // Return null instead of throwing error since this is for navigation
    }

    return data;
}
