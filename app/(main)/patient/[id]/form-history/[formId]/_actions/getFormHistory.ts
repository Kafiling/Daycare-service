'use server'

import { createClient } from "@/utils/supabase/server";
import type { FormSubmissionWithForm } from "@/app/service/patient";

export interface FormDetails {
  form_id: string;
  title: string;
  description?: string;
  label?: string;
  time_to_complete?: number;
  priority_level?: string;
  recurrence_schedule?: number[];
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getFormDetails(formId: string): Promise<FormDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('form_id', formId)
    .single();

  if (error) {
    console.error('Error fetching form details:', error);
    return null;
  }

  return data;
}

export async function getFormSubmissionHistory(
  patientId: string,
  formId: string
): Promise<FormSubmissionWithForm[]> {
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
    .eq('form_id', formId)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching form submission history:', error);
    throw error;
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
  })) || [];
}
