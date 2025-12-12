// lucide-react is for the Logo
import { Building2 } from "lucide-react";
import Link from "next/link";
import UserNav from "./user-nav";
import { createClient } from "@/utils/supabase/server";
import NavbarCurrentPatient from "./NavbarCurrentPatient";


export async function Navbar() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return null;
  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 mr-8">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Daycare Service</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            แดชบอร์ดพนักงาน
          </Link>
          <NavbarCurrentPatient />
        </div>

        <div className="flex items-center gap-6 ml-auto">
          <UserNav />
        </div>
      </div>
    </nav>
  );
}
