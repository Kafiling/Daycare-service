import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { getUserProfile } from "@/app/service/nurse";
import { ChangePasswordDialog } from "@/components/change-password-dialog";

import { revalidatePath } from "next/cache";

export default async function UserNav() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return null;

  // Fetch user profile from the profiles table
  let profile = null;
  try {
    profile = await getUserProfile(user.id);
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }

  // Use profile data if available, fallback to auth user data
  const displayName = profile
    ? `${profile.title ? profile.title : ''}${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || profile.email
    : user.email || 'Admin';

  const displayEmail = profile?.email || user.email;
  const displayPosition = profile?.position || 'พนักงาน';

  const initials = displayName
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
                <span className="text-sm font-medium">
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {displayPosition}
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
              alt={displayName}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
            {displayPosition && (
              <p className="text-xs leading-none text-muted-foreground">
                {displayPosition}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="p-0">
          <ChangePasswordDialog />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <LogoutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
