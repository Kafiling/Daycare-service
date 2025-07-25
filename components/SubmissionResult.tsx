import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { PreviousAnswers } from './PreviousAnswers';

interface Submission {
    id: string;
    patient_id: string;
    nurse_id: string;
    submitted_at: string;
    status: string;
    notes?: string;
    total_evaluation_score: number;
    evaluation_result?: string;
    evaluation_description?: string;
    answers?: Array<{
        question_id: number;
        answer_value: any;
    }>;
    form?: {
        title: string;
        description?: string;
        questions?: Array<{
            question_id: number;
            question_text: string;
            question_type: string;
            options?: any;
            helper_text?: string;
        }>;
    };
    nurse?: {
        name: string;
    };
}

interface SubmissionResultProps {
    submission: Submission;
    maxScore?: number;
    showDetails?: boolean;
    showAnswers?: boolean;
}

export function SubmissionResult({
    submission,
    maxScore = 100,
    showDetails = true,
    showAnswers = false
}: SubmissionResultProps) {
    const [showPreviousAnswers, setShowPreviousAnswers] = useState(false);
    const percentage = maxScore > 0 ? (submission.total_evaluation_score / maxScore) * 100 : 0;
    
    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        if (percentage >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    const getBadgeVariant = (percentage: number) => {
        if (percentage >= 80) return 'default'; // Green
        if (percentage >= 60) return 'secondary'; // Yellow
        if (percentage >= 40) return 'outline'; // Orange
        return 'destructive'; // Red
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="default">เสร็จสิ้น</Badge>;
            case 'pending':
                return <Badge variant="secondary">รอดำเนินการ</Badge>;
            case 'in_progress':
                return <Badge variant="outline">กำลังดำเนินการ</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {submission.form?.title || 'ฟอร์มประเมิน'}
                    </CardTitle>
                    {getStatusBadge(submission.status)}
                </div>
                {submission.form?.description && (
                    <p className="text-sm text-gray-600">{submission.form.description}</p>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Evaluation Score Section */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600">คะแนนการประเมิน</p>
                            <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                                {submission.total_evaluation_score} / {maxScore}
                            </p>
                        </div>
                        {submission.evaluation_result && (
                            <Badge variant={getBadgeVariant(percentage)} className="text-sm">
                                {submission.evaluation_result}
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>ความคืบหน้า</span>
                            <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                    </div>

                    {submission.evaluation_description && (
                        <div className="p-3 bg-white rounded border">
                            <p className="text-sm text-gray-700">{submission.evaluation_description}</p>
                        </div>
                    )}
                </div>

                {/* Submission Details */}
                {showDetails && (
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>ส่งเมื่อ: {new Date(submission.submitted_at).toLocaleString('th-TH')}</span>
                        </div>
                        {submission.nurse?.name && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>โดย: {submission.nurse.name}</span>
                            </div>
                        )}
                        {submission.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                                <p className="text-sm"><strong>หมายเหตุ:</strong> {submission.notes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Show Answers Button */}
                {showAnswers && submission.answers && submission.answers.length > 0 && (
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreviousAnswers(!showPreviousAnswers)}
                            className="w-full"
                        >
                            {showPreviousAnswers ? (
                                <>
                                    <ChevronUp className="h-4 w-4 mr-2" />
                                    ซ่อนคำตอบที่บันทึกไว้
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    แสดงคำตอบที่บันทึกไว้
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Previous Answers */}
                {showPreviousAnswers && submission.answers && submission.form?.questions && (
                    <div className="mt-4">
                        <PreviousAnswers 
                            answers={submission.answers}
                            questions={submission.form.questions}
                            showQuestionText={true}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
