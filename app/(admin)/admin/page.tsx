"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, FileText, Target, UserCog, Activity, FileDown, Loader2 } from 'lucide-react';
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { logExportAction } from "./_actions/logExport";

export default function AdminPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const supabase = createClient();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/export-data`, {
          method: 'POST',
          headers: {
              Authorization: `Bearer ${session.access_token}`
          }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `daycare_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Log the export activity via server action
      await logExportAction('full_export', {
        filename,
        export_date: new Date().toISOString(),
        file_size_bytes: blob.size
      });
      
      toast.success("ดาวน์โหลดข้อมูลสำเร็จ");

    } catch (error) {
      console.error("Export error:", error);
      toast.error("ไม่สามารถดาวน์โหลดข้อมูลได้");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8 space-y-8">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              แผงควบคุมสำหรับผู้ดูแลระบบ
            </h1>
            <p className="text-gray-600 mt-1">
              จัดการพนักงานและแบบสอบถามได้จากที่นี่
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link href="/admin/manage-patients" className="hover:shadow-lg transition-shadow duration-300 rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  จัดการผู้ใช้บริการ
                </CardTitle>
                <UserCog className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ดู ค้นหา และจัดการข้อมูลผู้ใช้บริการในระบบ
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/manage-staff" className="hover:shadow-lg transition-shadow duration-300 rounded-lg">
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

          <Link href="/admin/manage-forms" className="hover:shadow-lg transition-shadow duration-300 rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  จัดการแบบสอบถาม
                </CardTitle>
                <FileText className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  สร้าง แก้ไข และจัดการแบบสอบถามและแบบสำรวจสำหรับผู้ใช้บริการ
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/manage-group" className="hover:shadow-lg transition-shadow duration-300 rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  จัดการกลุ่ม
                </CardTitle>
                <Target className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ตั้งค่าเงื่อนไขการแบ่งกลุ่มผู้ใช้บริการอัตโนมัติตามคะแนนจากแบบสอบถาม
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/activity-logs" className="hover:shadow-lg transition-shadow duration-300 rounded-lg">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  บันทึกกิจกรรม
                </CardTitle>
                <Activity className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ติดตามและตรวจสอบบันทึกการเปลี่ยนแปลงทั้งหมดในระบบ
                </p>
              </CardContent>
            </Card>
          </Link>

          <div 
            onClick={handleExport}
            className="hover:shadow-lg transition-shadow duration-300 rounded-lg cursor-pointer"
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  ส่งออกข้อมูล
                </CardTitle>
                {isExporting ? (
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                ) : (
                  <FileDown className="h-6 w-6 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ส่งออกข้อมูลผู้ใช้บริการและการส่งแบบสอบถามเป็นไฟล์ Excel
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
