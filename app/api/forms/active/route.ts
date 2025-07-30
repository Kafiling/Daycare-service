import { NextResponse } from 'next/server';
import { getActiveForms } from '@/app/service/patient-client';

export async function GET() {
    try {
        const forms = await getActiveForms();
        return NextResponse.json(forms);
    } catch (error) {
        console.error('Error fetching active forms:', error);
        return NextResponse.json(
            { error: 'Failed to fetch forms' }, 
            { status: 500 }
        );
    }
}