'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getFirstQuestionByFormId } from '@/app/service/patient-client';

interface RedoFormButtonProps {
    patientId: string;
    formId: string;
    className?: string;
}

export default function RedoFormButton({ patientId, formId, className }: RedoFormButtonProps) {
    const router = useRouter();

    const handleRedoForm = async () => {
        try {
            // Get first question for this form
            const firstQuestion = await getFirstQuestionByFormId(formId);

            if (firstQuestion) {
                router.push(`/patient/${patientId}/${formId}/${firstQuestion.question_id}`);
            } else {
                console.error('No questions found for this form');
                alert('ไม่พบคำถามในแบบประเมินนี้');
            }
        } catch (err) {
            console.error('Error starting survey:', err);
            alert('เกิดข้อผิดพลาดในการเริ่มแบบประเมิน กรุณาลองใหม่อีกครั้ง');
        }
    };

    return (
        <Button 
            variant="outline" 
            className={`w-full text-base px-8 py-4 ${className || ''}`}
            onClick={handleRedoForm}
        >
            ทำแบบประเมินใหม่
        </Button>
    );
}
