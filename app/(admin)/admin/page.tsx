import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, FileText } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8 space-y-8">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  แผงควบคุมสำหรับผู้ดูแลระบบ
                </h1>
                <p className="text-gray-600 mt-1">
                  จัดการพนักงานและแบบฟอร์มได้จากที่นี่
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/staff-create" className="hover:shadow-lg transition-shadow duration-300 rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  จัดการพนักงาน
                </CardTitle>
                <Users className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  สร้าง ดู และจัดการบัญชีพนักงาน
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/form-create" className="hover:shadow-lg transition-shadow duration-300 rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  จัดการแบบฟอร์ม
                </CardTitle>
                <FileText className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  สร้าง แก้ไข และจัดการแบบฟอร์มและแบบสำรวจสำหรับผู้ใช้บริการ
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
