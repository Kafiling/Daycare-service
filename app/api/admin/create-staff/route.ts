import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createUserProfile } from '@/app/service/nurse';

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
    const { email, password, first_name, last_name, username, title, position } = body;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'ข้อมูลที่จำเป็นไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return NextResponse.json(
        { error: createError.message || 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้' },
        { status: 400 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้' },
        { status: 400 }
      );
    }

    // Create profile
    const profileData = {
      id: newUser.user.id,
      first_name: first_name || null,
      last_name: last_name || null,
      username: username || email,
      email,
      title: title || null,
      position: position || null,
    };

    try {
      const profile = await createUserProfile(profileData);
      return NextResponse.json({ success: true, profile });
    } catch (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการสร้างโปรไฟล์พนักงาน' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in create-staff API:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างพนักงาน' },
      { status: 500 }
    );
  }
}
