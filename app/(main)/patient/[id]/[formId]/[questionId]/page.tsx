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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays } from 'lucide-react';
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
    const [submissionDate, setSubmissionDate] = useState<string>('');


    useEffect(() => {
        const fetchData = async () => {
            if (!formId || !patientId) return;

            try {
                setIsLoading(true);
                const formResponse = await getFormById(formId);
                if (!formResponse) {
                    throw new Error("ไม่พบแบบสอบถาม");
                }
                setForm(formResponse);

                const questionsResponse = await getQuestionsByFormId(formId);
                setQuestions(questionsResponse);

                // Load existing answers from localStorage or session storage
                const storageKey = `form_answers_${formId}_${patientId}`;
                const savedAnswers = localStorage.getItem(storageKey);
                if (savedAnswers) {
                    try {
                        const parsedAnswers = JSON.parse(savedAnswers);
                        setAnswers(parsedAnswers);
                        console.log('📚 Loaded existing answers:', parsedAnswers);
                    } catch (error) {
                        console.error('Error parsing saved answers:', error);
                    }
                }

                // Restore submission date if set
                const dateKey = `form_submission_date_${formId}_${patientId}`;
                const savedDate = localStorage.getItem(dateKey);
                if (savedDate) setSubmissionDate(savedDate);

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
        const newAnswers = {
            ...answers,
            [currentQuestionId]: value
        };
        setAnswers(newAnswers);
        
        // Save to localStorage to persist across navigation
        const storageKey = `form_answers_${formId}_${patientId}`;
        localStorage.setItem(storageKey, JSON.stringify(newAnswers));
        console.log('💾 Saved answer for question', currentQuestionId, ':', value);
        console.log('📝 All answers now:', newAnswers);
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
        
        console.log('🔍 Starting score calculation...');
        console.log('📝 All answers:', answers);
        console.log('🔢 Number of answers:', Object.keys(answers).length);
        console.log('❓ All questions:', questions.map(q => ({ id: q.question_id, type: q.question_type })));
        console.log('🔢 Number of questions:', questions.length);
        
        // Check if we have answers for all questions
        const questionIds = questions.map(q => q.question_id);
        const answeredIds = Object.keys(answers).map(id => parseInt(id));
        const missingAnswers = questionIds.filter(id => !answeredIds.includes(id));
        
        if (missingAnswers.length > 0) {
            console.warn('⚠️ Missing answers for questions:', missingAnswers);
        }
        
        Object.entries(answers).forEach(([questionIdStr, answer]) => {
            const questionId = parseInt(questionIdStr, 10);
            const question = questions.find(q => q.question_id === questionId);
            
            if (!question) {
                console.log(`⚠️ Question not found for ID: ${questionId}`);
                return;
            }
            
            let questionScore = 0;
            console.log(`\n🔍 Processing question ${questionId}:`);
            console.log(`   Type: ${question.question_type}`);
            console.log(`   Answer: "${answer}"`);
            console.log(`   Options:`, question.options);
            
            switch (question.question_type) {
                case 'multiple_choice':
                case 'multipleChoice':
                    const choices = question.options?.choices || [];
                    console.log(`   Choices available:`, choices);
                    
                    const selectedChoice = choices.find((choice: any) => {
                        const choiceText = typeof choice === 'string' ? choice : (choice.text || choice.choice);
                        return choiceText === answer;
                    });
                    
                    if (selectedChoice) {
                        questionScore = typeof selectedChoice === 'string' ? 0 : (parseFloat(selectedChoice.score) || 0);
                        console.log(`   ✅ Found matching choice, score: ${questionScore}`);
                    } else {
                        console.log(`   ⚠️ No matching choice found for answer: "${answer}"`);
                    }
                    break;
                    
                case 'true_false':
                case 'trueFalse':
                    const options = question.options || {};
                    if (answer === 'true' && options.trueScore !== undefined) {
                        questionScore = parseFloat(options.trueScore) || 0;
                    } else if (answer === 'false' && options.falseScore !== undefined) {
                        questionScore = parseFloat(options.falseScore) || 0;
                    }
                    console.log(`   ✅ True/False score: ${questionScore}`);
                    break;
                    
                case 'rating':
                    const ratingValue = parseFloat(answer || '0');
                    const multiplier = Number(question.options?.scoreMultiplier) || 1;
                    // Calculate exact score with precision, no rounding to integer
                    questionScore = parseFloat((ratingValue * multiplier).toFixed(2));
                    console.log(`   ✅ Rating score: ${questionScore} (${ratingValue} × ${multiplier})`);
                    break;
                    
                case 'number':
                    const numberValue = parseFloat(answer || '0');
                    const numberMultiplier = Number(question.options?.scoreMultiplier) || 1;
                    // Calculate exact score with precision, no rounding to integer
                    questionScore = parseFloat((numberValue * numberMultiplier).toFixed(2));
                    console.log(`   ✅ Number score: ${questionScore} (${numberValue} × ${numberMultiplier})`);
                    break;
                    
                case 'text':
                    questionScore = 0;
                    console.log(`   ✅ Text question score: ${questionScore}`);
                    break;
                    
                default:
                    questionScore = 0;
                    console.log(`   ⚠️ Unknown question type: ${question.question_type}`);
            }
            
            console.log(`   📊 Question ${questionId} contributes: ${questionScore} points`);
            console.log(`   📈 Total before adding: ${totalScore}`);
            totalScore += questionScore;
            console.log(`   📈 Total after adding: ${totalScore}`);
        });
        
        console.log(`\n🎯 FINAL TOTAL SCORE: ${totalScore}`);
        console.log(`📊 Summary: Processed ${Object.keys(answers).length} answers out of ${questions.length} questions`);
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
                console.log('🎯 Processing evaluation thresholds:', JSON.stringify(thresholds, null, 2));
                console.log('📊 Total score to match:', totalScore);
                
                for (const threshold of thresholds) {
                    const minScore = threshold.min_score ?? threshold.minScore;
                    const maxScore = threshold.max_score ?? threshold.maxScore;
                    
                    console.log(`🔍 Checking threshold: min=${minScore}, max=${maxScore}, result="${threshold.result}"`);
                    console.log(`   Condition: ${totalScore} >= ${minScore} && ${totalScore} <= ${maxScore} = ${totalScore >= minScore && totalScore <= maxScore}`);
                    
                    if (totalScore >= minScore && totalScore <= maxScore) {
                        evaluationResult = threshold.result;
                        evaluationDescription = threshold.description;
                        console.log(`✅ Evaluation match found: ${evaluationResult} (${minScore}-${maxScore})`);
                        break;
                    }
                }
                
                if (!evaluationResult) {
                    console.log('⚠️ No matching threshold found for score:', totalScore);
                }
            } else {
                console.log('⚠️ No evaluation thresholds found');
            }
            
            console.log('📋 Final evaluation values:', { evaluationResult, evaluationDescription });

            // Check if there's already an in-progress submission for this patient/form
            console.log('🔍 Checking for existing in-progress submission...');
            const { data: existingSubmissions, error: checkError } = await supabase
                .from('submissions')
                .select('id')
                .eq('patient_id', patientId)
                .eq('form_id', formId)
                .eq('nurse_id', userData.user.id)
                .eq('status', 'in_progress')
                .order('submitted_at', { ascending: false })
                .limit(1);

            if (checkError) {
                console.error('❌ Error checking existing submissions:', checkError);
            } else {
                console.log('📋 Existing in-progress submissions:', existingSubmissions);
            }

            const existingSubmissionId = existingSubmissions && existingSubmissions.length > 0 
                ? existingSubmissions[0].id 
                : null;

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
                submitted_at: submissionDate
                    ? new Date(`${submissionDate}T00:00:00`).toISOString()
                    : new Date().toISOString(),
                notes: `Form submission completed with total score: ${totalScore}`
            };
            
            console.log('💾 Preparing to save submission data:', JSON.stringify(submissionData, null, 2));

            let submission;
            
            if (existingSubmissionId) {
                // Update existing in-progress submission
                console.log('🔄 Updating existing submission:', existingSubmissionId);
                const { data: updatedSubmission, error: updateError } = await supabase
                    .from('submissions')
                    .update(submissionData)
                    .eq('id', existingSubmissionId)
                    .select()
                    .single();

                if (updateError) {
                    console.error('❌ Submission update error:', {
                        error: updateError,
                        message: updateError.message,
                        details: updateError.details,
                        hint: updateError.hint,
                        code: updateError.code
                    });
                    throw new Error(`Failed to update submission: ${updateError.message || 'Unknown error'}`);
                }

                submission = updatedSubmission;
                console.log('✅ Submission updated successfully:', JSON.stringify(submission, null, 2));
            } else {
                // Create new submission if none exists
                console.log('➕ Creating new submission (no in-progress found)');
                const { data: newSubmission, error: insertError } = await supabase
                    .from('submissions')
                    .insert(submissionData)
                    .select()
                    .single();

                if (insertError) {
                    console.error('❌ Submission insert error:', {
                        error: insertError,
                        message: insertError.message,
                        details: insertError.details,
                        hint: insertError.hint,
                        code: insertError.code
                    });
                    throw new Error(`Failed to save submission: ${insertError.message || 'Unknown error'}`);
                }

                submission = newSubmission;
                console.log('✅ Submission saved successfully:', JSON.stringify(submission, null, 2));
            }

            console.log('🔍 Verifying saved evaluation_result:', submission.evaluation_result);
            console.log('🔑 Submission ID:', submission.id);

            // Clear saved answers and submission date from localStorage since form is completed
            const storageKey = `form_answers_${formId}_${patientId}`;
            localStorage.removeItem(storageKey);
            localStorage.removeItem(`form_submission_date_${formId}_${patientId}`);
            console.log('🗑️ Cleared saved answers from localStorage');

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
                                ผู้ใช้บริการ: นายสมชาย ใจดี
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
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Back */}
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                            className="text-base px-6 py-3 shrink-0"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            ย้อนกลับ
                        </Button>

                        {/* Centered date field */}
                        <div className="flex flex-col items-center gap-1 flex-1">
                            <Label htmlFor="submission-date" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CalendarDays className="h-3.5 w-3.5" />
                                บันทึกย้อนหลัง (ไม่บังคับ)
                            </Label>
                            <div className="flex items-center gap-1.5">
                                <Input
                                    id="submission-date"
                                    type="date"
                                    value={submissionDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSubmissionDate(val);
                                        const dateKey = `form_submission_date_${formId}_${patientId}`;
                                        if (val) {
                                            localStorage.setItem(dateKey, val);
                                        } else {
                                            localStorage.removeItem(dateKey);
                                        }
                                    }}
                                    className="text-sm h-8 w-40"
                                />
                                {submissionDate && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSubmissionDate('');
                                            localStorage.removeItem(`form_submission_date_${formId}_${patientId}`);
                                        }}
                                        className="text-muted-foreground hover:text-foreground text-sm leading-none"
                                        title="ล้างวันที่"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Next / Complete */}
                        <div className="shrink-0">
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

                    {submissionDate && (
                        <p className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md py-1.5 px-3">
                            ⚠️ จะบันทึกการส่งแบบสอบถามนี้ในวันที่ {new Date(`${submissionDate}T00:00:00`).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    )}

                    {currentQuestion.is_required && !isCurrentQuestionAnswered() && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-base text-yellow-800">
                                คำถามนี้จำเป็นต้องตอบก่อนดำเนินการต่อ
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Question Summary
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
            </Card> */}
        </div>
    );
}