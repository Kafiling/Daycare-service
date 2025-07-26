import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Home, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import RedoFormButton from '@/components/RedoFormButton';

interface ResultPageProps {
    params: Promise<{
        id: string;
        formId: string;
    }>;
    searchParams: Promise<{
        submissionId?: string;
    }>;
}

async function getSubmissionResult(submissionId: string) {
    console.log('🔍 Fetching submission result for ID:', submissionId);
    const supabase = await createClient();

    const { data: submission, error } = await supabase
        .from('submissions')
        .select(`
            *,
            forms (
                form_id,
                title,
                description,
                evaluation_thresholds
            ),
            patients (
                id,
                first_name,
                last_name
            )
        `)
        .eq('id', submissionId)
        .single();

    if (error) {
        console.error('❌ Error fetching submission:', error);
        console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        return null;
    }

    console.log('✅ Submission data retrieved:', submission);
    return submission;
}

async function getPatientData(patientId: string) {
    const supabase = await createClient();

    const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

    if (error) {
        console.error('Error fetching patient:', error);
        return null;
    }

    return patient;
}

function getEvaluationBadge(result: string | null) {
    if (!result) return null;

    const resultLower = result.toLowerCase();
    if (resultLower.includes('ดีมาก') || resultLower.includes('excellent')) {
        return <Badge className="bg-green-100 text-green-800">ดีมาก</Badge>;
    } else if (resultLower.includes('ดี') || resultLower.includes('good')) {
        return <Badge className="bg-blue-100 text-blue-800">ดี</Badge>;
    } else if (resultLower.includes('ปานกลาง') || resultLower.includes('average')) {
        return <Badge className="bg-yellow-100 text-yellow-800">ปานกลาง</Badge>;
    } else if (resultLower.includes('ต้องปรับปรุง') || resultLower.includes('needs improvement')) {
        return <Badge className="bg-red-100 text-red-800">ต้องปรับปรุง</Badge>;
    }

    return <Badge variant="outline">{result}</Badge>;
}

export default async function ResultPage({ params, searchParams }: ResultPageProps) {
    // Await params and searchParams in Next.js 15
    const { id: patientId, formId } = await params;
    const { submissionId } = await searchParams;

    console.log('📊 Result page loaded with params:', {
        patientId,
        formId,
        submissionId
    });

    // Fetch submission result and patient data
    const [submission, patient] = await Promise.all([
        submissionId ? getSubmissionResult(submissionId) : Promise.resolve(null),
        getPatientData(patientId)
    ]);

    console.log('📋 Data fetching results:', {
        hasSubmission: !!submission,
        hasPatient: !!patient,
        submissionId: submissionId
    });

    // If no submissionId or submission not found, show error state instead of redirecting
    if (!submissionId || !submission) {
        console.log('⚠️ No submission data found, showing error state');
        return (
            <div className="container mx-auto p-6">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-red-100 rounded-full p-3 w-fit">
                            <AlertCircle className="h-12 w-12 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl mt-4">ไม่พบข้อมูลการประเมิน</CardTitle>
                        <CardDescription className="text-base">
                            ไม่สามารถแสดงผลการประเมินได้ เนื่องจากไม่พบข้อมูลการส่งฟอร์ม
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pt-6">
                        <Link href={`/patient/${patientId}/home`}>
                            <Button className="text-base px-8 py-4">
                                <Home className="h-5 w-5 mr-2" />
                                กลับไปหน้าหลัก
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const totalScore = submission.total_evaluation_score || 0;
    const evaluationResult = submission.evaluation_result;
    const evaluationDescription = submission.evaluation_description;
    const formTitle = submission.forms?.title || 'แบบประเมิน';
    const patientName = patient?.first_name || patient?.last_name ? 
        `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 
        'ผู้ป่วย';

    console.log('📈 Displaying result data:', {
        totalScore,
        evaluationResult,
        evaluationDescription,
        formTitle,
        patientName,
        patientData: patient
    });

    // Get thresholds for evaluation thresholds display
    const thresholds = submission.forms?.evaluation_thresholds || [];

    return (
        <div className="container mx-auto p-6">
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl mt-4">การประเมินเสร็จสมบูรณ์</CardTitle>
                    <CardDescription className="text-base">
                        ผลการประเมิน{formTitle} สำหรับ {patientName}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Score Display */}
                    <div className="p-6 bg-gray-50 rounded-lg text-center">
                        <p className="text-lg text-muted-foreground">คะแนนรวมของคุณคือ</p>
                        <div className="flex items-center justify-center gap-4 mt-2">
                            <p className="text-6xl font-bold text-primary">{totalScore}</p>
                        </div>
                    </div>

                    {/* Evaluation Result */}
                    {evaluationResult && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    ผลการประเมิน
                                    {getEvaluationBadge(evaluationResult)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <h3 className="font-semibold text-lg mb-2">{evaluationResult}</h3>
                                {evaluationDescription && (
                                    <p className="text-gray-700">{evaluationDescription}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Evaluation Thresholds Reference */}
                    {thresholds.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    เกณฑ์การประเมิน
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {thresholds.map((threshold: any, index: number) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg border ${totalScore >= threshold.minScore && totalScore <= threshold.maxScore
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">
                                                    {threshold.minScore} - {threshold.maxScore} คะแนน
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {threshold.result}
                                                </span>
                                            </div>
                                            {threshold.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {threshold.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Submission Details */}
                    <Card className="bg-blue-50">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">วันที่ประเมิน</p>
                                    <p className="font-medium">
                                        {new Date(submission.submitted_at).toLocaleDateString('th-TH', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">เวลา</p>
                                    <p className="font-medium">
                                        {new Date(submission.submitted_at).toLocaleTimeString('th-TH', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">สถานะ</p>
                                    <Badge variant={submission.status === 'completed' ? 'default' : 'outline'}>
                                        {submission.status === 'completed' ? 'เสร็จสิ้น' : submission.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-gray-600">รหัสการส่ง</p>
                                    <p className="font-mono text-xs">{submission.id.slice(0, 8)}...</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                                        {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Link href={`/patient/${patientId}/home`} className="flex-1">
                            <Button className="w-full text-base px-8 py-4">
                                <Home className="h-5 w-5 mr-2" />
                                กลับไปหน้าหลัก
                            </Button>
                        </Link>
                        <RedoFormButton 
                            patientId={patientId} 
                            formId={formId}
                            className="flex-1"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
