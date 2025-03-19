import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/(login)/login/actions";
import { ModalOneAction } from "./modal";
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">เข้าสู่ระบบ Daycare</h1>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-3 ">
                <div className="flex items-center justify-between ">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex justify-end">
                    <ModalOneAction
                      openText="Forgot password?"
                      title="Forgot password?"
                      description="Please contact your administrator."
                    />
                  </div>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button
                type="submit"
                formAction={login}
                className="w-full bg-primary text-white"
              >
                Login
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
        Copyright here, all rights reserved
      </div>
    </div>
  );
}
