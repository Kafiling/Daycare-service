import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getAllStaffProfiles, Profile } from '@/app/service/nurse';
import { StaffManagementClient } from './StaffManagementClient';

export default async function ManageStaffPage() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  // For now, we'll assume any authenticated user can access admin features
  // In a real app, you'd check for admin role/permissions here
  
  let staffProfiles: Profile[] = [];
  try {
    staffProfiles = await getAllStaffProfiles();
  } catch (error) {
    console.error('Error fetching staff profiles:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">จัดการพนักงาน</h1>
        <p className="text-gray-600 mt-2">
          เพิ่ม แก้ไข และจัดการข้อมูลพนักงานในระบบ
        </p>
      </div>

      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <StaffManagementClient initialStaff={staffProfiles} />
      </Suspense>
    </div>
  );
}
