"use server";

import { createClient } from "@/utils/supabase/server";
import { getMaximumScore } from "@/utils/evaluation";

/**
 * Get the maximum possible score for a form by its ID
 */
export async function getFormMaxScore(formId: string): Promise<number> {
    const supabase = await createClient();
    
    const { data: form, error } = await supabase
        .from("forms")
        .select(`
            questions (
                question_type,
                options,
                evaluation_scores
            )
        `)
        .eq("form_id", formId)
        .single();

    if (error || !form) {
        console.error("Error fetching form for max score calculation:", error);
        return 100; // Default fallback
    }

    // Convert to the format expected by getMaximumScore
    const questions = form.questions.map((q: any, index: number) => ({
        question_id: index + 1,
        question_type: q.question_type,
        options: q.options || {},
        evaluation_scores: q.evaluation_scores || {}
    }));

    return getMaximumScore(questions);
}

/**
 * Get submissions with calculated max scores for accurate percentage display
 */
export async function getSubmissionsWithMaxScores(patientId: string) {
    const supabase = await createClient();
    
    const { data: submissions, error } = await supabase
        .from("submissions")
        .select(`
            *,
            forms (
                form_id,
                title,
                description,
                evaluation_thresholds,
                questions (
                    question_id,
                    question_text,
                    question_type,
                    options,
                    helper_text,
                    evaluation_scores
                )
            ),
            profiles (
                name:full_name
            )
        `)
        .eq("patient_id", patientId)
        .order("submitted_at", { ascending: false });

    if (error) {
        console.error("Error fetching submissions:", error);
        return { error: "Failed to fetch submissions" };
    }

    // Calculate max scores for each submission
    const submissionsWithMaxScores = submissions?.map(submission => {
        let maxScore = 100; // Default
        
        if (submission.forms?.questions) {
            const questions = submission.forms.questions.map((q: any) => ({
                question_id: q.question_id,
                question_type: q.question_type,
                options: q.options || {},
                evaluation_scores: q.evaluation_scores || {}
            }));
            
            maxScore = getMaximumScore(questions);
        }
        
        return {
            ...submission,
            maxScore
        };
    });

    return { submissions: submissionsWithMaxScores };
}
