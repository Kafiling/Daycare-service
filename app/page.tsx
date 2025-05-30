import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientIdInput } from "@/components/searchPatientByID"; // Import the new Client Component
import { DashboardGrid } from "./dashboard-charts";

export default async function Page() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8 space-y-8">
        {/* Search Patient */}
        <Card>
          <CardHeader>
            <CardTitle>ค้นหาผู้ป่วย</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientIdInput />
          </CardContent>
        </Card>

        {/* Dashboard Charts */}
        <DashboardGrid />
      </main>
    </div>
  );
}
