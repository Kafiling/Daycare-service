"use server";

import { createClient } from "@/utils/supabase/server";
import { calculateTotalScore, getEvaluationResult } from "@/utils/evaluation";
import { revalidatePath } from "next/cache";

interface SubmitFormResponse {
    formId: string;
    patientId: string;
    answers: Array<{
        question_id: number;
        answer_value: any;
    }>;
}

export async function submitFormResponse(payload: SubmitFormResponse) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to submit a form response." };
    }

    const { formId, patientId, answers } = payload;

    try {
        // Get form and questions data
        const { data: form, error: formError } = await supabase
            .from("forms")
            .select("*, questions(*)")
            .eq("form_id", formId)
            .single();

        if (formError || !form) {
            return { error: "Form not found." };
        }

        // Calculate evaluation score
        const totalScore = calculateTotalScore(form.questions, answers);
        
        // Get evaluation result based on thresholds
        const evaluationResult = getEvaluationResult(
            totalScore, 
            form.evaluation_thresholds || []
        );

        // Insert form submission using your existing submissions table
        const { data: submission, error: submissionError } = await supabase
            .from("submissions")
            .insert({
                form_id: formId,
                patient_id: patientId,
                nurse_id: user.id,
                submitted_at: new Date().toISOString(),
                status: 'completed',
                total_evaluation_score: totalScore,
                evaluation_result: evaluationResult?.result || null,
                evaluation_description: evaluationResult?.description || null,
                answers: answers, // Store the complete answers JSON
                notes: `Total Score: ${totalScore}${evaluationResult ? ` - ${evaluationResult.result}` : ''}`,
            })
            .select()
            .single();

        if (submissionError) {
            console.error("Error inserting submission:", submissionError);
            return { error: "Failed to submit form response." };
        }

        // You'll need to create a separate answers table or store answers in a JSONB field
        // For now, let's create a simple answers table if it doesn't exist
        // This stores individual question answers linked to the submission
        const answerData = answers.map((answer) => ({
            submission_id: submission.id,
            question_id: answer.question_id,
            answer_value: answer.answer_value,
        }));

        // Insert into a submission_answers table (you may need to create this)
        const { error: answersError } = await supabase
            .from("submission_answers")
            .insert(answerData);

        if (answersError) {
            console.error("Error inserting answers:", answersError);
            // If submission_answers table doesn't exist, we can store answers in submissions.notes or create the table
            console.log("Note: You may need to create submission_answers table or store answers differently");
        }

        revalidatePath(`/patient/${patientId}`);

        return { 
            success: true, 
            submissionId: submission.id,
            totalScore,
            evaluationResult: evaluationResult?.result,
            evaluationDescription: evaluationResult?.description
        };

    } catch (error) {
        console.error("Error submitting form response:", error);
        return { error: "An unexpected error occurred." };
    }
}
