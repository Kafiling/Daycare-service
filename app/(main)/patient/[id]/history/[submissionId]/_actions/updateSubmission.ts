'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { calculateTotalScore } from '@/lib/scoring';

export async function updateSubmission(
    submissionId: string,
    patientId: string,
    formId: string,
    answers: Record<number, string>,
    newDatetime: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
        return { success: false, error: 'ไม่สามารถระบุตัวตนผู้ใช้ได้ กรุณาเข้าสู่ระบบใหม่' };
    }

    const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('question_id', { ascending: true });

    if (questionsError) {
        return { success: false, error: `ไม่สามารถโหลดคำถามได้: ${questionsError.message}` };
    }

    const totalScore = calculateTotalScore(answers, questions || []);

    const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('evaluation_thresholds')
        .eq('form_id', formId)
        .single();

    if (formError) {
        return { success: false, error: `ไม่สามารถโหลดแบบฟอร์มได้: ${formError.message}` };
    }

    let evaluationResult: string | null = null;
    let evaluationDescription: string | null = null;

    if (formData?.evaluation_thresholds) {
        for (const threshold of formData.evaluation_thresholds) {
            const minScore = threshold.min_score ?? threshold.minScore;
            const maxScore = threshold.max_score ?? threshold.maxScore;
            if (totalScore >= minScore && totalScore <= maxScore) {
                evaluationResult = threshold.result;
                evaluationDescription = threshold.description;
                break;
            }
        }
    }

    const { error: updateError } = await supabase
        .from('submissions')
        .update({
            submitted_at: newDatetime,
            answers,
            total_evaluation_score: totalScore,
            evaluation_result: evaluationResult,
            evaluation_description: evaluationDescription,
        })
        .eq('id', submissionId);

    if (updateError) {
        return { success: false, error: `ไม่สามารถบันทึกข้อมูลได้: ${updateError.message}` };
    }

    // Re-evaluate group assignment based on the updated score
    const { error: rpcError } = await supabase.rpc('assign_patient_to_multiple_groups', {
        patient_id_param: patientId,
    });

    if (rpcError) {
        console.error('Group assignment RPC error:', rpcError);
        // Don't fail the whole operation — the submission is already saved
    }

    revalidatePath(`/patient/${patientId}/history/${submissionId}`);

    return { success: true };
}
