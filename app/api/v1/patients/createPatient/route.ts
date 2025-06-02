import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server';

// Define TypeScript interface for input validation
interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    phone_num?: string;
    weight?: number;
    height?: number;
    address?: object;
    title?: string;
    email?: string;
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()

    const body: Patient = await req.json();

    // Basic input validation
    const requiredFields = ['id', 'first_name', 'last_name'];
    for (const field of requiredFields) {
        if (!body[field as keyof Patient]) {
            return NextResponse.json(
                { error: `Missing required field: ${field}` },
                { status: 400 }
            );
        }
    }

    const { error } = await supabase.from('patients').insert([body]);

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: 'Patient created successfully' },
        { status: 201 }
    );
  }