import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { PatientIdInput } from "@/components/PatientIdInput"; // Import the new Client Component

export default async function Page() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>ค้นหาผู้ป่วย</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex items-end">
              <div className="flex-1">
                <Label htmlFor="patientId" className="py-2">
                  เลขบัตรประชาชน 13 หลัก (Thai ID)
                </Label>
                <PatientIdInput />
              </div>
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
