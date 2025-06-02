import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const supabase = await createClient()

    const headers = new Headers(req.headers);
    const patientId = headers.get('patientId');

    if (!patientId) {
        return NextResponse.json(
            { error: 'Missing patientId header' },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }

    if (!data) {
        return NextResponse.json(
            { error: 'Patient not found' },
            { status: 404 }
        );
    }

    return NextResponse.json(data);
}
