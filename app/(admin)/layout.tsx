import { NavbarAdmin } from "@/components/navbarAdmin";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('position')
    .eq('id', user.id)
    .single();

  if (profile?.position !== 'ผู้ดูแลระบบ') {
    redirect('/');
  }

  return (
    <>
      <NavbarAdmin />
      {children}
    </>
  );
}
