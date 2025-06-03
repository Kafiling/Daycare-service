"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    ArrowRight,
    Save,
    CheckCircle2,
    FileText,
    User,
    Clock
} from 'lucide-react';
import QuestionRenderer from '@/components/question-types/QuestionRenderer';

// Mock data - will be replaced with Supabase data later
const mockForm = {
    id: 1,
    title: "แบบประเมินสุขภาพทั่วไป",
    description: "แบบประเมินสถานะสุขภาพโดยรวมของผู้ป่วย",
    version: 1,
    created_at: "2024-01-15T10:30:00Z"
};

const mockQuestions = [
    {
        id: 1,
        form_id: 1,
        question_text: "คุณรู้สึกเป็นอย่างไรเกี่ยวกับสุขภาพโดยรวมของคุณ?",
        question_type: "mcq",
        options: {
            choices: [
                { value: "excellent", label: "ดีเยี่ยม" },
                { value: "good", label: "ดี" },
                { value: "fair", label: "ปานกลาง" },
                { value: "poor", label: "แย่" }
            ]
        },
        is_required: true,
        helper_text: "เลือกตัวเลือกที่ตรงกับความรู้สึกของคุณมากที่สุด",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 2,
        form_id: 1,
        question_text: "ให้คะแนนระดับความเครียดของคุณในช่วง 7 วันที่ผ่านมา",
        question_type: "rating",
        options: {
            maxRating: 5,
            minRating: 1,
            labels: {
                1: "ไม่มีความเครียด",
                2: "เครียดเล็กน้อย",
                3: "เครียดปานกลาง",
                4: "เครียดมาก",
                5: "เครียดมากที่สุด"
            }
        },
        is_required: true,
        helper_text: "1 = ไม่มีความเครียด, 5 = เครียดมากที่สุด",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 3,
        form_id: 1,
        question_text: "คุณออกกำลังกายเป็นประจำหรือไม่?",
        question_type: "true_false",
        options: {
            trueLabel: "ใช่ ออกกำลังกายเป็นประจำ",
            falseLabel: "ไม่ ไม่ออกกำลังกายเป็นประจำ"
        },
        is_required: true,
        helper_text: "กำลังกายเป็นประจำหมายถึงอย่างน้อย 3 ครั้งต่อสัปดาห์",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 4,
        form_id: 1,
        question_text: "น้ำหนักปัจจุบันของคุณ (กิโลกรัม)",
        question_type: "number",
        options: {
            min: 20,
            max: 200,
            step: 0.1,
            unit: "กก."
        },
        is_required: true,
        helper_text: "กรุณาใส่น้ำหนักปัจจุบันของคุณ",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 5,
        form_id: 1,
        question_text: "อธิบายอาการหรือปัญหาสุขภาพที่คุณกังวล (ถ้ามี)",
        question_type: "text",
        options: {
            placeholder: "อธิบายอาการหรือปัญหาสุขภาพ...",
            maxLength: 500
        },
        is_required: false,
        helper_text: "คุณสามารถข้ามคำถามนี้ได้หากไม่มีอาการที่กังวล",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    }
];

const mockPatient = {
    id: "1234567890123",
    title: "นาย",
    first_name: "สมชาย",
    last_name: "ใจดี"
};

export default function QuestionPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;
    const formId = parseInt(params.formId as string);
    const currentQuestionId = parseInt(params.questionId as string);

    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Find current question index
    const currentQuestionIndex = mockQuestions.findIndex(q => q.id === currentQuestionId);
    const currentQuestion = mockQuestions[currentQuestionIndex];
    const totalQuestions = mockQuestions.length;
    const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    const handleAnswerChange = (value: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestionId]: value
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            const nextQuestion = mockQuestions[currentQuestionIndex + 1];
            router.push(`/patient/${patientId}/${formId}/${nextQuestion.id}`);
        } else {
            // Last question - redirect to completion page or back to dashboard
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            const prevQuestion = mockQuestions[currentQuestionIndex - 1];
            router.push(`/patient/${patientId}/${formId}/${prevQuestion.id}`);
        }
    };

    const handleComplete = async () => {
        setIsSaving(true);
        try {
            // Here you would save the answers to Supabase
            console.log('Saving answers:', answers);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Redirect back to patient dashboard
            router.push(`/patient/${patientId}/home`);
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

    if (!currentQuestion) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">ไม่พบคำถามที่ระบุ</p>
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
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {mockForm.title}
                            </CardTitle>
                            <CardDescription>
                                ผู้ป่วย: {mockPatient.title} {mockPatient.first_name} {mockPatient.last_name}
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <Badge variant="outline">
                                คำถามที่ {currentQuestionIndex + 1} จาก {totalQuestions}
                            </Badge>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>ความคืบหน้า</span>
                            <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="w-full" />
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
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                ย้อนกลับ
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                บันทึกร่าง
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            {currentQuestionIndex === totalQuestions - 1 ? (
                                <Button
                                    onClick={handleComplete}
                                    disabled={!isCurrentQuestionAnswered() || isSaving}
                                    className="min-w-[120px]"
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    {isSaving ? 'กำลังบันทึก...' : 'เสร็จสิ้น'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleNext}
                                    disabled={!isCurrentQuestionAnswered()}
                                >
                                    ถัดไป
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {currentQuestion.is_required && !isCurrentQuestionAnswered() && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                คำถามนี้จำเป็นต้องตอบก่อนดำเนินการต่อ
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Question Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">สรุปการตอบคำถาม</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        {mockQuestions.map((question, index) => (
                            <div
                                key={question.id}
                                className={`p-2 rounded border text-center text-xs cursor-pointer transition-colors ${index === currentQuestionIndex
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : answers[question.id]
                                            ? 'bg-green-50 border-green-200 text-green-800'
                                            : 'bg-gray-50 border-gray-200 text-gray-600'
                                    }`}
                                onClick={() => router.push(`/patient/${patientId}/${formId}/${question.id}`)}
                            >
                                <div>คำถาม {index + 1}</div>
                                {answers[question.id] && (
                                    <CheckCircle2 className="h-3 w-3 mx-auto mt-1" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}