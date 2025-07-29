"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // Get the input value (could be email or username)
  const emailOrUsername = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!emailOrUsername || !password) {
    redirect("/error?message=missing_credentials");
    return;
  }

  let email = emailOrUsername;

  // Check if the input looks like an email (contains @)
  if (!emailOrUsername.includes("@")) {
    // It's likely a username, so we need to look up the email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", emailOrUsername.trim())
      .single();

    if (profileError || !profile) {
      redirect("/error?message=user_not_found");
      return;
    }

    email = profile.email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/error?message=invalid_credentials");
    return;
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
