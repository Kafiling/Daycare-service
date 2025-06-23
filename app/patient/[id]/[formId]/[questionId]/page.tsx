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

// Mock data - will be replaced with Supabase data later
const mockForm = {
    id: 1,
    title: "แบบประเมินโรคซึมเศร้า 9 คำถาม (9Q)",
    description: "คำแนะนำ : สอบถามผู้สูงอายุถึงอาการที่เกิดขึ้นในช่วง 2 สัปดาห์ที่ผ่านมาจนถึงวันที่สัมภาษณ์ ถามทีละข้อไม่ช้าหรือเร็วเกินไป พยายามให้ได้คำตอบทุกข้อ ถ้าผู้สูงอายุไม่เข้าใจให้ถามซ้ำ ไม่ควรอธิบายหรือขยายความ ควรถามซ้ำจนกว่าผู้สูงอายุจะตอบตามความเข้าใจของตัวเอง",
    version: 1,
    created_at: "2024-01-15T10:30:00Z"
};

const mockQuestions = [
    {
        id: 1,
        form_id: 1,
        question_text: "ในช่วง 2 สัปดาห์ที่ผ่านมาคุณรู้สึกเบื่อ ไม่สนใจอยากทำอะไร",
        question_type: "mcq",
        options: {
            choices: [
                { value: "0", label: "ไม่มีเลย" },
                { value: "1", label: "เป็นบางวัน (1-7 วัน)" },
                { value: "2", label: "เป็นบ่อย (>7 วัน)" },
                { value: "3", label: "เป็นทุกวัน" }
            ]
        },
        is_required: true,
        helper_text: "",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 2,
        form_id: 1,
        question_text: "ในช่วง 2 สัปดาห์ที่ผ่านมาคุณรู้สึกไม่สบายใจ ซึมเศร้า ท้อแท้",
        question_type: "mcq",
        options: {
            choices: [
                { value: "0", label: "ไม่มีเลย" },
                { value: "1", label: "เป็นบางวัน (1-7 วัน)" },
                { value: "2", label: "เป็นบ่อย (>7 วัน)" },
                { value: "3", label: "เป็นทุกวัน" }
            ]
        },
        is_required: true,
        helper_text: "",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 3,
        form_id: 1,
        question_text: "ในช่วง 2 สัปดาห์ที่ผ่านมาคุณรู้สึกหลับยาก หรือ หลับๆ ตื่นๆ หรือ หลับมากไป",
        question_type: "mcq",
        options: {
            choices: [
                { value: "0", label: "ไม่มีเลย" },
                { value: "1", label: "เป็นบางวัน (1-7 วัน)" },
                { value: "2", label: "เป็นบ่อย (>7 วัน)" },
                { value: "3", label: "เป็นทุกวัน" }
            ]
        },
        is_required: true,
        helper_text: "",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 4,
        form_id: 1,
        question_text: "ในช่วง 2 สัปดาห์ที่ผ่านมาคุณรู้สึกเหนื่อยง่าย หรือ ไม่ค่อยมีแรง",
        question_type: "mcq",
        options: {
            choices: [
                { value: "0", label: "ไม่มีเลย" },
                { value: "1", label: "เป็นบางวัน (1-7 วัน)" },
                { value: "2", label: "เป็นบ่อย (>7 วัน)" },
                { value: "3", label: "เป็นทุกวัน" }
            ]
        },
        is_required: true,
        helper_text: "",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 5,
        form_id: 1,
        question_text: "ในช่วง 2 สัปดาห์ที่ผ่านมาคุณรู้สึกเบื่ออาหาร หรือ กินมากเกินไป",
        question_type: "mcq",
        options: {
            choices: [
                { value: "0", label: "ไม่มีเลย" },
                { value: "1", label: "เป็นบางวัน (1-7 วัน)" },
                { value: "2", label: "เป็นบ่อย (>7 วัน)" },
                { value: "3", label: "เป็นทุกวัน" }
            ]
        },
        is_required: true,
        helper_text: "",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 6,
        form_id: 1,
        question_text: "ในช่วง 2 สัปดาห์ที่ผ่านมาคุณรู้สึกรู้สึกไม่ดีกับตัวเอง คิดว่าตัวเองล้มเหลว หรือทำให้ตนเองหรือครอบครัวผิดหวัง",
        question_type: "mcq",
        options: {
            choices: [
                { value: "0", label: "ไม่มีเลย" },
                { value: "1", label: "เป็นบางวัน (1-7 วัน)" },
                { value: "2", label: "เป็นบ่อย (>7 วัน)" },
                { value: "3", label: "เป็นทุกวัน" }
            ]
        },
        is_required: true,
        helper_text: "",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 7,
        form_id: 1,
        question_text: "ในช่วง 2 สัปดาห์ที่ผ่านมาคุณรู้สึกสมาธิไม่ดีเวลาทำอะไร เช่น ดูโทรทัศน์ ฟังวิทยุ หรือทำงานที่ต้องใช้ความตั้งใจ",
        question_type: "mcq",
        options: {
            choices: [
                { value: "0", label: "ไม่มีเลย" },
                { value: "1", label: "เป็นบางวัน (1-7 วัน)" },
                { value: "2", label: "เป็นบ่อย (>7 วัน)" },
                { value: "3", label: "เป็นทุกวัน" }
            ]
        },
        is_required: true,
        helper_text: "",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 8,
        form_id: 1,
        question_text: "ในช่วง 2 สัปดาห์ที่ผ่านมาคุณรู้สึกพูดช้า ทำอะไรช้าลงจนคนอื่นสังเกตเห็นได้ หรือ กระสับกระส่ายไม่สามารถอยู่นิ่งได้เหมือนที่เคยเป็น",
        question_type: "mcq",
        options: {
            choices: [
                { value: "0", label: "ไม่มีเลย" },
                { value: "1", label: "เป็นบางวัน (1-7 วัน)" },
                { value: "2", label: "เป็นบ่อย (>7 วัน)" },
                { value: "3", label: "เป็นทุกวัน" }
            ]
        },
        is_required: true,
        helper_text: "",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    },
    {
        id: 9,
        form_id: 1,
        question_text: "ในช่วง 2 สัปดาห์ที่ผ่านมาคุณรู้สึกคิดทำร้ายตนเอง หรือคิดว่าถ้าตายไปคงจะดี",
        question_type: "mcq",
        options: {
            choices: [
                { value: "0", label: "ไม่มีเลย" },
                { value: "1", label: "เป็นบางวัน (1-7 วัน)" },
                { value: "2", label: "เป็นบ่อย (>7 วัน)" },
                { value: "3", label: "เป็นทุกวัน" }
            ]
        },
        is_required: true,
        helper_text: "",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
    }
];

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

    if (!currentQuestion) {
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
                                {mockForm.title}
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                ผู้ป่วย: {mockPatient.title} {mockPatient.first_name} {mockPatient.last_name}
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <Badge variant="outline" className="text-sm px-3 py-1">
                                คำถามที่ {currentQuestionIndex + 1} จาก {totalQuestions}
                            </Badge>
                        </div>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground pt-4">
                        {mockForm.description}
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
                        {mockQuestions.map((question, index) => (
                            <div
                                key={question.id}
                                className={`p-3 rounded border text-center text-sm cursor-pointer transition-colors ${index === currentQuestionIndex
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : answers[question.id]
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-600'
                                    }`}
                                onClick={() => router.push(`/patient/${patientId}/${formId}/${question.id}`)}
                            >
                                <div className="font-medium">คำถาม {index + 1}</div>
                                {answers[question.id] && (
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