import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/login");

  return NextResponse.json({ success: true });
}
