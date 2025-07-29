import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
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
    const { staffId, newPassword } = body;

    if (!staffId || !newPassword) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    // Update user password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(staffId, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in reset-password API:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' },
      { status: 500 }
    );
  }
}
