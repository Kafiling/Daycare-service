import React from 'react';
import { getPatientById } from '@/app/service/patient';
import PatientEditForm from './PatientEditForm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditPatientPage({ params }: PageProps) {
    const resolvedParams = await params;
    const patient = await getPatientById(resolvedParams.id);

    if (!patient) {
        notFound();
    }

    return (
        <div className="container mx-auto py-10">
            <Link href={`/patient/${resolvedParams.id}/home`}>
                <Button variant="ghost" size="sm" className="gap-2 mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    กลับ
                </Button>
            </Link>
            <h1 className="text-2xl font-bold mb-6">แก้ไขข้อมูลผู้ใช้บริการ</h1>
            <PatientEditForm initialData={patient} />
        </div>
    );
}
