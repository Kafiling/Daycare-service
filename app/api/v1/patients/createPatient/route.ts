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
    address?: string;
    road?: string;
    sub_district?: string;
    district?: string;
    province?: string;
    postal_num?: string;
    title?: string;
    email?: string;
    profile_image_url?: string;
    // New fields
    caregiver_name?: string;
    media_consent?: boolean;
    transportation?: string;
    parking_requirement?: boolean;
    distance_from_home?: number;
    gender?: string;
    marital_status?: string;
    education_level?: string;
    fall_history?: boolean;
    underlying_diseases?: string[];
    hospitalization_history?: boolean;
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()

    const body: Patient = await req.json();

    console.log("Received body:", body);
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
        console.error("Error inserting patient:", error);
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