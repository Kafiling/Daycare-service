// lucide-react is for the Logo
import { Building2 } from "lucide-react";
import Link from "next/link";
import { UserNav } from "./user-nav";
import { createClient } from "@/utils/supabase/server";

export async function Navbar() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 mr-8">
          <Building2 className="h-6 w-6 text-[#DB5F8E]" />
          <span className="font-semibold text-lg">Daycare Service</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Dashboard
          </Link>
          <Link
            href="/patients"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Patients
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {user && (
            <div className="hidden md:flex flex-col items-end mr-4">
              {/* TODO : Add Position for med staff inside supabase db */}
              <span className="text-sm font-medium">{user.email}</span>
              <span className="text-xs text-muted-foreground">
                Lorem Specialist
              </span>
            </div>
          )}
          <UserNav />
        </div>
      </div>
    </nav>
  );
}
