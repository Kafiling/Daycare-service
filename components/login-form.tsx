"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/(login)/login/actions";
import { ModalOneAction } from "./modal";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error && !hasShownToast.current) {
      hasShownToast.current = true;
      
      // Clear the error from URL after showing toast
      window.history.replaceState({}, '', '/login');
      
      if (error === "missing_credentials") {
        toast.error("กรุณากรอกอีเมลและรหัสผ่าน");
      } else if (error === "user_not_found") {
        toast.error("ไม่พบผู้ใช้งานในระบบ");
      } else if (error === "invalid_credentials") {
        toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    }
  }, [searchParams]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">เข้าสู่ระบบ Chula Daycare</h1>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">อีเมล หรือ ชื่อผู้ใช้</Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="อีเมล หรือ ชื่อผู้ใช้"
                  required
                />
              </div>
              <div className="grid gap-3 ">
                <div className="flex items-center justify-between ">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <div className="flex justify-end">
                    <ModalOneAction
                      openText="ลืมรหัสผ่าน?"
                      title="ลืมรหัสผ่าน?"
                      description="กรุณาติดต่อผู้ดูแลระบบ (Admin)"
                    />
                  </div>
                </div>
                <Input id="password" name="password" type="password" placeholder="รหัสผ่าน" required />
              </div>
              <Button
                type="submit"
                formAction={login}
                className="w-full bg-primary text-white"
              >
                เข้าสู่ระบบ
              </Button>
            </div>
          </form>
          <div className="bg-muted relative hidden md:flex md:justify-center md:items-center">
            <img
              src="/Med Login.svg"
              alt="Image"
              className="w-5/6 object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        © {new Date().getFullYear()} Chula Daycare Service, All rights reserved
      </div>
    </div>
  );
}
