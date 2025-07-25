"use server";

import { createClient } from "@/utils/supabase/server";

export async function getSubmissionsByPatient(patientId: string) {
    const supabase = await createClient();
    
    const { data: submissions, error } = await supabase
        .from("submissions")
        .select(`
            *,
            forms (
                title,
                description,
                evaluation_thresholds,
                questions (
                    question_id,
                    question_text,
                    question_type,
                    options,
                    helper_text
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

    return { submissions };
}

export async function getSubmissionById(submissionId: string) {
    const supabase = await createClient();
    
    const { data: submission, error } = await supabase
        .from("submissions")
        .select(`
            *,
            forms (
                title,
                description,
                evaluation_thresholds,
                questions (
                    question_id,
                    question_text,
                    question_type,
                    options,
                    helper_text
                )
            ),
            profiles (
                name:full_name
            )
        `)
        .eq("id", submissionId)
        .single();

    if (error) {
        console.error("Error fetching submission:", error);
        return { error: "Failed to fetch submission" };
    }

    return { submission };
}

export async function getSubmissionsByForm(formId: string) {
    const supabase = await createClient();
    
    const { data: submissions, error } = await supabase
        .from("submissions")
        .select(`
            *,
            patients (
                id,
                name
            ),
            profiles (
                name:full_name
            )
        `)
        .eq("form_id", formId)
        .order("submitted_at", { ascending: false });

    if (error) {
        console.error("Error fetching form submissions:", error);
        return { error: "Failed to fetch form submissions" };
    }

    return { submissions };
}

// Get submission statistics for a form
export async function getFormSubmissionStats(formId: string) {
    const supabase = await createClient();
    
    const { data: submissions, error } = await supabase
        .from("submissions")
        .select("total_evaluation_score, evaluation_result")
        .eq("form_id", formId)
        .not("total_evaluation_score", "is", null);

    if (error) {
        console.error("Error fetching submission stats:", error);
        return { error: "Failed to fetch submission statistics" };
    }

    // Calculate statistics
    const totalSubmissions = submissions.length;
    if (totalSubmissions === 0) {
        return {
            totalSubmissions: 0,
            averageScore: 0,
            resultDistribution: {},
            scoreRange: { min: 0, max: 0 }
        };
    }

    const scores = submissions.map(s => s.total_evaluation_score).filter(Boolean);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Count evaluation results
    const resultDistribution: Record<string, number> = {};
    submissions.forEach(submission => {
        if (submission.evaluation_result) {
            resultDistribution[submission.evaluation_result] = 
                (resultDistribution[submission.evaluation_result] || 0) + 1;
        }
    });

    return {
        totalSubmissions,
        averageScore: Math.round(averageScore * 100) / 100,
        resultDistribution,
        scoreRange: { min: minScore, max: maxScore }
    };
}
