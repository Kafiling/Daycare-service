import React from 'react';
import { getPatientById } from '@/app/service/patient';
import PatientEditForm from './PatientEditForm';
import { notFound } from 'next/navigation';

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
            <h1 className="text-2xl font-bold mb-6">แก้ไขข้อมูลผู้ใช้บริการ</h1>
            <PatientEditForm initialData={patient} />
        </div>
    );
}
