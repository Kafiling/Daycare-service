"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPatientById } from '@/app/service/patient-client';
import type { Patient } from '@/app/service/patient-client';

export default function navbarCurrentPatient() {
    const params = useParams();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const patientId = params?.id as string;

        if (patientId) {
            setIsLoading(true);
            getPatientById(patientId)
                .then((patientData) => {
                    setPatient(patientData);
                })
                .catch((error) => {
                    console.error('Error fetching patient for navbar:', error);
                    setPatient(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setPatient(null);
        }
    }, [params?.id]);

    // Don't show anything if no patient ID in URL
    if (!params?.id) {
        return null;
    }

    if (isLoading) {
        return (
            <span className="text-sm font-medium text-muted-foreground">
                กำลังโหลดข้อมูลผู้ป่วย...
            </span>
        );
    }

    if (!patient) {
        return (
            <span className="text-sm font-medium text-red-600">
                ไม่พบข้อมูลผู้ป่วย
            </span>
        );
    }

    // Format patient name with title
    const displayName = `${patient.title || ''} ${patient.first_name} ${patient.last_name}`.trim();

    // Format patient ID for display (add dashes back)
    const formattedId = patient.id.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');

    return (
        <div className="text-sm font-medium transition-colors text-primary" >
            ขณะนี้กำลังบริการ {displayName} ({formattedId})
        </div>
    );
}