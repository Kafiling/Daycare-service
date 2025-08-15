"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function updateForm(formId: string, formData: any) {
  try {
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
      questions,
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
      .from("forms")
      .update({
        title,
        description,
        label,
        time_to_complete,
        priority_level,
        is_active,
        evaluation_thresholds: formattedThresholds,
        updated_at: new Date().toISOString(),
      })
      .eq("form_id", formId);

    if (formUpdateError) {
      console.error("Error updating form:", formUpdateError);
      throw new Error(`Failed to update form: ${formUpdateError.message}`);
    }

    // Delete existing questions and re-insert new ones
    const { error: questionsDeleteError } = await supabase
      .from("questions")
      .delete()
      .eq("form_id", formId);

    if (questionsDeleteError) {
      console.error("Error deleting existing questions:", questionsDeleteError);
      throw new Error(
        `Failed to update form questions: ${questionsDeleteError.message}`
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
        helper_text: q.helper_text || "",
        options: q.options || {},
      }));

      const { error: questionsInsertError } = await supabase
        .from("questions")
        .insert(formattedQuestions);

      if (questionsInsertError) {
        console.error("Error inserting new questions:", questionsInsertError);
        throw new Error(
          `Failed to update form questions: ${questionsInsertError.message}`
        );
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { success: false, error: error.message };
  }
}
