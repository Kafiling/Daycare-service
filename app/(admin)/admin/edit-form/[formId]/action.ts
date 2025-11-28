"use server";

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function updateForm(formId: string, formData: any) {
  try {
    console.log('=== UPDATE FORM START ===');
    console.log('Form ID:', formId);
    console.log('Received evaluation_thresholds:', JSON.stringify(formData.evaluation_thresholds));

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
      recurrence_schedule,
      questions,
    } = formData;

    // Format evaluation thresholds for saving in the forms table
    const formattedThresholds = evaluation_thresholds ? evaluation_thresholds.map((t: any) => ({
      min_score: t.minScore,
      max_score: t.maxScore,
      result: t.result,
      description: t.description || "",
    })) : [];

    console.log(`Updating form ${formId} with evaluation_thresholds:`, JSON.stringify(formattedThresholds));

    // Update the form base data - try using admin client to bypass RLS
    const adminClient = createAdminClient();
    const { data: updateData, error: formUpdateError } = await adminClient
      .from("forms")
      .update({
        title,
        description,
        label,
        time_to_complete,
        priority_level,
        is_active,
        evaluation_thresholds: formattedThresholds,
        recurrence_schedule,
        updated_at: new Date().toISOString(),
      })
      .eq("form_id", formId)
      .select();

    console.log('Update result:', { data: updateData, error: formUpdateError });

    if (formUpdateError) {
      console.error("Error updating form:", formUpdateError);
      throw new Error(`Failed to update form: ${formUpdateError.message}`);
    }

    console.log(`Form ${formId} updated successfully`);

    // Verify the update by reading back the form
    const { data: updatedForm, error: verifyError } = await adminClient
      .from("forms")
      .select("evaluation_thresholds")
      .eq("form_id", formId)
      .single();

    if (verifyError) {
      console.error("Error verifying form update:", verifyError);
    } else {
      console.log("Verified evaluation_thresholds after update:", JSON.stringify(updatedForm.evaluation_thresholds));
    }

    // Delete existing questions and re-insert new ones
    // This approach ensures no duplicate key conflicts with the composite primary key (question_id, form_id)
    // Use admin client to bypass RLS for deletion
    // (adminClient already created above)

    // First, let's check what questions exist before deletion
    const { data: existingQuestions, error: checkBeforeError } = await adminClient
      .from("questions")
      .select("question_id, form_id")
      .eq("form_id", formId);

    if (checkBeforeError) {
      console.error("Error checking existing questions:", checkBeforeError);
      throw new Error(
        `Failed to check existing questions: ${checkBeforeError.message}`
      );
    }

    console.log(`Found ${existingQuestions?.length || 0} existing questions before deletion`);

    // Attempt to delete with explicit return using admin client
    const { data: deletedData, error: questionsDeleteError, count } = await adminClient
      .from("questions")
      .delete({ count: 'exact' })
      .eq("form_id", formId)
      .select();

    console.log(`Delete operation returned: error=${questionsDeleteError}, deletedCount=${deletedData?.length}, count=${count}`);

    if (questionsDeleteError) {
      console.error("Error deleting existing questions:", questionsDeleteError);
      throw new Error(
        `Failed to delete existing questions: ${questionsDeleteError.message}`
      );
    }

    console.log(`Deleted ${deletedData?.length || 0} existing questions for form ${formId}`);

    // Insert new questions
    if (questions && questions.length > 0) {
      // Verify deletion was successful by checking if any questions still exist
      const { data: remainingQuestions, error: checkError } = await adminClient
        .from("questions")
        .select("question_id")
        .eq("form_id", formId);

      if (checkError) {
        console.error("Error checking remaining questions:", checkError);
      } else if (remainingQuestions && remainingQuestions.length > 0) {
        console.warn(`Warning: ${remainingQuestions.length} questions still exist after deletion!`);
        throw new Error(
          `Failed to properly delete existing questions. ${remainingQuestions.length} questions still remain.`
        );
      }

      // Get the maximum question_id across ALL forms to ensure uniqueness
      const { data: maxIdData, error: maxIdError } = await supabase
        .from("questions")
        .select("question_id")
        .order("question_id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxIdError) {
        console.error("Error fetching max question_id:", maxIdError);
        throw new Error(
          `Failed to get max question_id: ${maxIdError.message}`
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
        helper_text: q.helper_text || "",
        options: q.options || {},
        evaluation_scores: q.evaluation_scores || {},
      }));

      console.log(`Inserting ${formattedQuestions.length} new questions with IDs: ${formattedQuestions.map((q: any) => q.question_id).join(', ')}`);

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
