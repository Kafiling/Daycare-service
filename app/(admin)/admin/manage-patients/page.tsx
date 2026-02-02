import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Trash2 } from 'lucide-react';
import Link from 'next/link';
import PatientTable from './PatientTable';
import DeletedPatientsTable from './DeletedPatientsTable';
import { getAllPatients, getDeletedPatients } from './_actions/patientActions';

export default async function ManagePatientsPage() {
  const patients = await getAllPatients();
  const deletedPatients = await getDeletedPatients();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้าแผงควบคุม
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">จัดการผู้ใช้บริการ</h1>
        </div>
        <p className="text-muted-foreground">
          ดู ค้นหา และจัดการข้อมูลผู้ใช้บริการในระบบ
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อผู้ใช้บริการทั้งหมด</CardTitle>
          <CardDescription>
            แสดงข้อมูลผู้ใช้บริการทั้งหมดในระบบ สามารถค้นหาและลบข้อมูลได้
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              กำลังโหลดข้อมูล...
            </div>
          }>
            <PatientTable initialPatients={patients} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Deleted Patients Section */}
      <Card className="mt-6 border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-800">ผู้ใช้บริการที่ถูกลบเมื่อเร็วๆ นี้</CardTitle>
          </div>
          <CardDescription>
            รายชื่อผู้ใช้บริการที่ถูกลบชั่วคราว สามารถคืนค่าข้อมูลได้ก่อนที่จะถูกลบถาวร
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              กำลังโหลดข้อมูล...
            </div>
          }>
            <DeletedPatientsTable initialPatients={deletedPatients} />
          </Suspense>
        </CardContent>
      </Card>

      <Card className="mt-6 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">ข้อมูลเกี่ยวกับการลบข้อมูล</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-orange-700 space-y-2">
          <p>
            • เมื่อลบข้อมูลผู้ใช้บริการ ข้อมูลจะถูก <strong>ซ่อน</strong> จากระบบทันที แต่ยังคงอยู่ในฐานข้อมูล
          </p>
          <p>
            • ข้อมูลจะถูกลบถาวรอัตโนมัติหลังจาก <strong>3 เดือน</strong> นับจากวันที่ลบ
          </p>
          <p>
            • ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้หลังจากถูกลบถาวร
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
