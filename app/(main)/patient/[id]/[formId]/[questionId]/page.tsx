"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    ArrowLeft,
    ArrowRight,
    Save,
    CheckCircle2,
    FileText,
} from 'lucide-react';
import QuestionRenderer from '@/components/question-types/QuestionRenderer';
import { getFormById, getQuestionsByFormId } from '@/app/service/patient-client';
import { Form, Question } from '@/app/service/patient-client';

export default function QuestionPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;
    const formId = params.formId as string; // formId is now a UUID string
    const currentQuestionId = parseInt(params.questionId as string);

    const [form, setForm] = useState<Form | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const fetchData = async () => {
            if (!formId || !patientId) return;

            try {
                setIsLoading(true);
                const formResponse = await getFormById(formId);
                if (!formResponse) {
                    throw new Error("ไม่พบฟอร์ม");
                }
                setForm(formResponse);

                const questionsResponse = await getQuestionsByFormId(formId);
                setQuestions(questionsResponse);

            } catch (err: any) {
                setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [formId, patientId]);


    // Find current question index
    const currentQuestionIndex = questions.findIndex(q => q.question_id === currentQuestionId);
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const progressPercentage = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

    const handleAnswerChange = (value: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestionId]: value
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            const nextQuestion = questions[currentQuestionIndex + 1];
            router.push(`/patient/${patientId}/${formId}/${nextQuestion.question_id}`);
        } else {
            // Last question - redirect to completion page or back to dashboard
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            const prevQuestion = questions[currentQuestionIndex - 1];
            router.push(`/patient/${patientId}/${formId}/${prevQuestion.question_id}`);
        }
    };

    const handleComplete = async () => {
        setIsSaving(true);
        try {
            // Calculate total score
            const totalScore = Object.values(answers).reduce((sum, value) => sum + parseInt(value || '0', 10), 0);

            // Here you would save the answers and the score to Supabase
            console.log('Saving answers:', answers);
            console.log('Total score:', totalScore);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Redirect to the result page with the score
            router.push(`/patient/${patientId}/${formId}/result?score=${totalScore}`);
        } catch (error) {
            console.error('Error saving answers:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        try {
            // Save as draft to Supabase
            console.log('Saving draft:', answers);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error saving draft:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const isCurrentQuestionAnswered = () => {
        const answer = answers[currentQuestionId];
        if (currentQuestion.is_required) {
            return answer !== undefined && answer.trim() !== '';
        }
        return true; // Optional questions are always considered "answered"
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground text-lg">กำลังโหลด...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-red-500 text-lg">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }


    if (!currentQuestion || !form) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground text-lg">ไม่พบคำถามที่ระบุ</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <FileText className="h-6 w-6" />
                                {form.title}
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                {/* Replace with actual patient data later */}
                                ผู้ป่วย: นายสมชาย ใจดี
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <Badge variant="outline" className="text-sm px-3 py-1">
                                คำถามที่ {currentQuestionIndex + 1} จาก {totalQuestions}
                            </Badge>
                        </div>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground pt-4">
                        {form.description}
                    </CardDescription>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-base text-muted-foreground">
                            <span>ความคืบหน้า</span>
                            <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="w-full h-3" />
                    </div>
                </CardHeader>
            </Card>

            {/* Question */}
            <QuestionRenderer
                question={currentQuestion}
                value={answers[currentQuestionId] || ''}
                onChange={handleAnswerChange}
            />

            {/* Navigation */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handlePrevious}
                                disabled={currentQuestionIndex === 0}
                                className="text-base px-6 py-3"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                ย้อนกลับ
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="text-base px-6 py-3"
                            >
                                <Save className="h-5 w-5 mr-2" />
                                บันทึกร่าง
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            {currentQuestionIndex === totalQuestions - 1 ? (
                                <Button
                                    onClick={handleComplete}
                                    disabled={!isCurrentQuestionAnswered() || isSaving}
                                    className="min-w-[140px] text-base px-6 py-3"
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    {isSaving ? 'กำลังบันทึก...' : 'เสร็จสิ้น'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleNext}
                                    disabled={!isCurrentQuestionAnswered()}
                                    className="text-base px-6 py-3"
                                >
                                    ถัดไป
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {currentQuestion.is_required && !isCurrentQuestionAnswered() && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-base text-yellow-800">
                                คำถามนี้จำเป็นต้องตอบก่อนดำเนินการต่อ
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Question Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">สรุปการตอบคำถาม</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {questions.map((question, index) => (
                            <div
                                key={question.question_id}
                                className={`p-3 rounded border text-center text-sm cursor-pointer transition-colors ${index === currentQuestionIndex
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : answers[question.question_id]
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-600'
                                    }`}
                                onClick={() => router.push(`/patient/${patientId}/${formId}/${question.question_id}`)}
                            >
                                <div className="font-medium">คำถาม {index + 1}</div>
                                {answers[question.question_id] && (
                                    <CheckCircle2 className="h-4 w-4 mx-auto mt-2" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}