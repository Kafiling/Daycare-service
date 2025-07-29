import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    // Check if current user is authorized
    const { data: currentUser, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser?.user) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ในการดำเนินการ' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { staffId } = body;

    if (!staffId) {
      return NextResponse.json(
        { error: 'ไม่ระบุ ID พนักงาน' },
        { status: 400 }
      );
    }

    // Prevent deleting self
    if (currentUser.user.id === staffId) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบบัญชีของตนเองได้' },
        { status: 400 }
      );
    }

    // Delete profile first (due to foreign key constraints)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', staffId);

    if (profileError) {
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการลบข้อมูลโปรไฟล์' },
        { status: 400 }
      );
    }

    // Delete auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(staffId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || 'เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in delete-staff API:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบพนักงาน' },
      { status: 500 }
    );
  }
}
