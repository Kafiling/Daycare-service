import React from 'react';
import { SubmissionResult } from '@/components/SubmissionResult';
import { getSubmissionsWithMaxScores } from '@/app/_actions/getFormScores';

interface PatientSubmissionsPageProps {
    params: {
        patientId: string;
    };
}

export default async function PatientSubmissionsPage({ 
    params 
}: PatientSubmissionsPageProps) {
    const { submissions, error } = await getSubmissionsWithMaxScores(params.patientId);

    if (error) {
        return (
            <div className="container mx-auto p-8">
                <div className="text-center text-red-600">
                    เกิดข้อผิดพลาด: {error}
                </div>
            </div>
        );
    }

    if (!submissions || submissions.length === 0) {
        return (
            <div className="container mx-auto p-8">
                <div className="text-center text-gray-500">
                    ไม่มีข้อมูลการส่งฟอร์ม
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">ประวัติการส่งฟอร์ม</h1>
                
                {submissions.map((submission) => (
                    <SubmissionResult
                        key={submission.id}
                        submission={submission}
                        maxScore={submission.maxScore} // Use calculated max score
                        showDetails={true}
                        showAnswers={true} // Enable the show answers feature
                    />
                ))}
            </div>
        </div>
    );
}
