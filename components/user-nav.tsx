import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/server";
import { LogoutButton } from "@/components/logout-button";

import { revalidatePath } from "next/cache";

export default async function UserNav() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return null;

  const initials =
    user.email ||
    "Admin"
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative ">
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
            <div />
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                initials
              )}`}
              alt={user.email}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <LogoutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
