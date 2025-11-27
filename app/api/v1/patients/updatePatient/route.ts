import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server';

// Define TypeScript interface for input validation
interface PatientUpdate {
    id: string;
    first_name?: string;
    last_name?: string;
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

export async function PATCH(req: NextRequest) {
    const supabase = await createClient()

    const body: PatientUpdate = await req.json();

    console.log("Received update body:", body);

    if (!body.id) {
        return NextResponse.json(
            { error: "Missing required field: id" },
            { status: 400 }
        );
    }

    const { id, ...updates } = body;

    const { error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error("Error updating patient:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: 'Patient updated successfully' },
        { status: 200 }
    );
}
