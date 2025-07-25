"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function createForm(payload: any) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to create a form." };
    }

    const { title, description, questions } = payload;
    const formId = randomUUID();

    // Insert into forms table
    const { data: form, error: formError } = await supabase
        .from("forms")
        .insert({
            form_id: formId,
            title,
            description,
            created_by: user.id,
        })
        .select()
        .single();

    if (formError) {
        console.error("Error inserting form:", formError);
        return { error: "Failed to create form." };
    }

    // Insert into questions table
    const questionData = questions.map((q: any, index: number) => ({
        question_id: index + 1, // Use question_id as the key
        form_id: form.form_id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        is_required: q.is_required,
        helper_text: q.helper_text,
    }));

    const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionData);

    if (questionsError) {
        console.error("Error inserting questions:", questionsError);
        // Optionally, delete the form if questions fail to insert
        await supabase.from("forms").delete().match({ form_id: form.form_id });
        return { error: "Failed to create questions." };
    }

    revalidatePath("/admin/create-form");

    return { success: true, formId: form.form_id };
}
