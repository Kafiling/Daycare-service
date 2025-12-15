import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { GroupAssignmentManagementClient } from './GroupAssignmentManagementClient';

export default async function ManageGroupAssignmentsPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">จัดการการจัดการกลุ่ม</h1>
        <p className="text-gray-600 mt-2">
          ตั้งค่าเงื่อนไขการแบ่งกลุ่มผู้ใช้บริการอัตโนมัติตามคะแนนจากแบบสอบถาม
        </p>
      </div>

      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <GroupAssignmentManagementClient />
      </Suspense>
    </div>
  );
}
