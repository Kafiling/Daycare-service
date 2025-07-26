import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientIdInput } from "@/components/searchPatientByID"; // Import the new Client Component
import { DashboardActivityGrid } from "./DashboardActivityGrid";
import { getUserProfile } from "@/app/service/nurse";

export default async function Page() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  // Fetch user profile for greeting
  let profile = null;
  try {
    profile = await getUserProfile(data.user.id);
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }

  // Prepare display data
  const displayName = profile
    ? `${profile.title ? profile.title + ' ' : ''}${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || profile.email
    : data.user.email || 'Admin';

  const displayPosition = profile?.position || 'พนักงาน';

  // Get current time for appropriate greeting
  const currentHour = new Date().getHours();
  let greeting = 'สวัสดี'; // Default greeting
  if (currentHour >= 5 && currentHour < 12) {
    greeting = 'สวัสดีตอนเช้า';
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = 'สวัสดีตอนบ่าย';
  } else {
    greeting = 'สวัสดีตอนเย็น';
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8 space-y-8">
        {/* Greeting Section */}
        <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
          <CardContent className="">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {greeting}, {displayName}! 👋
                </h1>
                <p className="text-gray-600 mt-1">
                  ตำแหน่ง: {displayPosition}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ยินดีต้อนรับสู่ระบบดูแลผู้ใช้บริการ
                </p>
              </div>
              <div className="hidden md:block">
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    วันที่: {new Date().toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    เวลา: {new Date().toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} น.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Patient */}
        <Card>
          <CardHeader>
            <CardTitle>ค้นหาผู้ใช้บริการ</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientIdInput />
          </CardContent>
        </Card>

        {/* Dashboard Content */}
        <DashboardActivityGrid />
      </main>
    </div>
  );
}
