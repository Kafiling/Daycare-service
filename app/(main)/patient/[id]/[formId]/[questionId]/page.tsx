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
import { createClient } from '@/utils/supabase/client';

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

    const calculateTotalScore = (answers: Record<number, string>, questions: any[]) => {
        let totalScore = 0;
        
        Object.entries(answers).forEach(([questionIdStr, answer]) => {
            const questionId = parseInt(questionIdStr, 10); // Convert string back to number
            const question = questions.find(q => q.question_id === questionId);
            if (!question) {
                console.log(`⚠️ Question not found for ID: ${questionId}`);
                return;
            }
            
            let questionScore = 0;
            console.log(`🔍 Processing question ${questionId}, type: ${question.question_type}, answer: ${answer}`);
            
            switch (question.question_type) {
                case 'multiple_choice':
                case 'multipleChoice':
                    // Find the score for the selected option
                    const choices = question.options?.choices || [];
                    console.log(`🔍 Multiple choice choices:`, choices);
                    const selectedChoice = choices.find((choice: any) => {
                        const choiceText = typeof choice === 'string' ? choice : choice.text;
                        return choiceText === answer;
                    });
                    
                    if (selectedChoice) {
                        questionScore = typeof selectedChoice === 'string' ? 0 : (selectedChoice.score || 0);
                        console.log(`✅ Multiple choice score: ${questionScore} for answer: ${answer}`);
                    } else {
                        console.log(`⚠️ No matching choice found for answer: ${answer}`);
                    }
                    break;
                    
                case 'true_false':
                case 'trueFalse':
                    // True/False scoring logic
                    const options = question.options || {};
                    if (answer === 'true' && options.trueScore !== undefined) {
                        questionScore = options.trueScore;
                        console.log(`✅ True/False score (true): ${questionScore}`);
                    } else if (answer === 'false' && options.falseScore !== undefined) {
                        questionScore = options.falseScore;
                        console.log(`✅ True/False score (false): ${questionScore}`);
                    }
                    break;
                    
                case 'rating':
                    // Rating scoring - can use the rating value directly or map it
                    const ratingValue = parseInt(answer || '0', 10);
                    questionScore = question.options?.scoreMultiplier ? 
                        ratingValue * question.options.scoreMultiplier : ratingValue;
                    console.log(`✅ Rating score: ${questionScore} (${ratingValue} × ${question.options?.scoreMultiplier || 1})`);
                    break;
                    
                case 'number':
                    // Number scoring - can use the number directly or apply ranges
                    const numberValue = parseInt(answer || '0', 10);
                    questionScore = question.options?.scoreMultiplier ? 
                        numberValue * question.options.scoreMultiplier : numberValue;
                    console.log(`✅ Number score: ${questionScore} (${numberValue} × ${question.options?.scoreMultiplier || 1})`);
                    break;
                    
                case 'text':
                    // Text questions typically don't contribute to scoring
                    questionScore = 0;
                    console.log(`✅ Text question score: ${questionScore}`);
                    break;
                    
                default:
                    questionScore = 0;
                    console.log(`⚠️ Unknown question type: ${question.question_type}, score: ${questionScore}`);
            }
            
            console.log(`📊 Question ${questionId} contributes ${questionScore} points`);
            totalScore += questionScore;
        });
        
        console.log(`🎯 Final total score: ${totalScore}`);
        return totalScore;
    };

    const handleComplete = async () => {
        setIsSaving(true);
        console.log('🚀 Starting form submission process...');
        
        try {
            // Calculate total score using proper evaluation logic
            console.log('🔍 Input data for score calculation:');
            console.log('📝 Answers:', answers);
            console.log('❓ Questions:', questions.map(q => ({ id: q.question_id, type: q.question_type, options: q.options })));
            
            const totalScore = calculateTotalScore(answers, questions);
            console.log('� Calculated total score:', totalScore);

            // Save the submission to Supabase
            const supabase = createClient();
            console.log('🔗 Supabase client created');

            // Get current user for nurse_id
            console.log('👤 Getting current user...');
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData?.user) {
                console.error('❌ User auth error:', userError);
                throw new Error('ไม่สามารถระบุตัวตนผู้ใช้ได้ กรุณาเข้าสู่ระบบใหม่');
            }
            console.log('✅ User authenticated:', userData.user.id);

            // Calculate evaluation based on form thresholds
            console.log('📋 Fetching form evaluation thresholds...');
            const { data: formData, error: formError } = await supabase
                .from('forms')
                .select('evaluation_thresholds')
                .eq('form_id', formId)
                .single();

            if (formError) {
                console.error('❌ Error fetching form data:', formError);
            } else {
                console.log('✅ Form data retrieved:', formData);
            }

            let evaluationResult = null;
            let evaluationDescription = null;

            if (formData?.evaluation_thresholds) {
                const thresholds = formData.evaluation_thresholds;
                console.log('🎯 Processing evaluation thresholds:', thresholds);
                
                for (const threshold of thresholds) {
                    if (totalScore >= threshold.minScore && totalScore <= threshold.maxScore) {
                        evaluationResult = threshold.result;
                        evaluationDescription = threshold.description;
                        console.log(`✅ Evaluation match found: ${evaluationResult} (${threshold.minScore}-${threshold.maxScore})`);
                        break;
                    }
                }
            } else {
                console.log('⚠️ No evaluation thresholds found');
            }

            // Prepare submission data
            const submissionData = {
                patient_id: patientId,
                form_id: formId,
                nurse_id: userData.user.id,
                answers: answers,
                total_evaluation_score: totalScore,
                evaluation_result: evaluationResult,
                evaluation_description: evaluationDescription,
                status: 'completed',
                submitted_at: new Date().toISOString(),
                notes: `Form submission completed with total score: ${totalScore}`
            };
            
            console.log('💾 Preparing to insert submission data:', submissionData);

            // Insert submission record
            const { data: submission, error: submitError } = await supabase
                .from('submissions')
                .insert(submissionData)
                .select()
                .single();

            if (submitError) {
                console.error('❌ Submission insert error:', {
                    error: submitError,
                    message: submitError.message,
                    details: submitError.details,
                    hint: submitError.hint,
                    code: submitError.code
                });
                throw new Error(`Failed to save submission: ${submitError.message || 'Unknown error'}`);
            }

            console.log('✅ Submission saved successfully:', submission);
            console.log('🔑 Submission ID:', submission.id);

            // Wait 1 second before redirect for better UX
            console.log('⏳ Waiting 1 second before redirect...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Redirect to the result page with the submission ID
            const redirectUrl = `/patient/${patientId}/${formId}/result?submissionId=${submission.id}`;
            console.log('🔄 Redirecting to:', redirectUrl);
            router.push(redirectUrl);
            
        } catch (error) {
            console.error('❌ Error in handleComplete:', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            
            // Show user-friendly error message
            const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
            alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${errorMessage}\n\nกรุณาลองใหม่อีกครั้ง`);
        } finally {
            setIsSaving(false);
            console.log('🏁 Form submission process completed');
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
            {/* Loading Overlay */}
            {isSaving && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-80">
                        <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                <div>
                                    <h3 className="text-lg font-semibold">กำลังบันทึกข้อมูล</h3>
                                    <p className="text-sm text-gray-600 mt-1">กรุณารอสักครู่...</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            
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
                                    className="min-w-[160px] text-base px-6 py-3"
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    {isSaving ? 'กำลังบันทึกข้อมูล...' : 'เสร็จสิ้น'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleNext}
                                    disabled={!isCurrentQuestionAnswered() || isSaving}
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