"use client";

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Home } from 'lucide-react';

const mockEvaluationCriteria = [
    { score_range: "<7", interpretation: "ไม่มีอาการของโรคซึมเศร้าหรือมีอาการโรคซึมเศร้าระดับน้อยมาก" },
    { score_range: "7-12", interpretation: "มีอาการของโรคซึมเศร้าระดับน้อย" },
    { score_range: "13-18", interpretation: "มีอาการของโรคซึมเศร้าระดับปานกลาง" },
    { score_range: ">=19", interpretation: "มีอาการของโรคซึมเศร้าระดับรุนแรง" }
];

const mockPatient = {
    id: "1234567890123",
    title: "นาย",
    first_name: "สมชาย",
    last_name: "ใจดี"
};

const mockForm = {
    id: 1,
    title: "แบบประเมินโรคซึมเศร้า 9 คำถาม (9Q)",
};

function getInterpretation(score: number) {
    if (score < 7) {
        return mockEvaluationCriteria[0].interpretation;
    } else if (score >= 7 && score <= 12) {
        return mockEvaluationCriteria[1].interpretation;
    } else if (score >= 13 && score <= 18) {
        return mockEvaluationCriteria[2].interpretation;
    } else {
        return mockEvaluationCriteria[3].interpretation;
    }
}

export default function ResultPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const score = searchParams.get('score');
    const patientId = params.id as string;

    const totalScore = parseInt(score || '0', 10);
    const interpretation = getInterpretation(totalScore);

    return (
        <div className="container mx-auto p-6">
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl mt-4">การประเมินเสร็จสมบูรณ์</CardTitle>
                    <CardDescription className="text-base">
                        ผลการประเมินสำหรับ {mockForm.title}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-lg text-center">
                        <p className="text-lg text-muted-foreground">คะแนนรวมของคุณคือ</p>
                        <p className="text-6xl font-bold text-primary">{totalScore}</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">ผลการประเมิน</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg">{interpretation}</p>
                        </CardContent>
                    </Card>

                    <div className="text-center pt-4">
                        <Button onClick={() => router.push(`/patient/${patientId}/home`)} className="text-base px-8 py-4">
                            <Home className="h-5 w-5 mr-2" />
                            กลับไปหน้าหลัก
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
