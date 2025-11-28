import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, FileText, User } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

interface HistoryDetailPageProps {
    params: Promise<{
        id: string;
        submissionId: string;
    }>;
}

async function getSubmissionDetails(submissionId: string) {
    const supabase = await createClient();

    const { data: submission, error } = await supabase
        .from('submissions')
        .select(`
            *,
            forms (
                form_id,
                title,
                description,
                label
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
        console.error('Error fetching submission:', error);
        return null;
    }

    return submission;
}

async function getFormQuestions(formId: string) {
    const supabase = await createClient();
    
    const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('question_id', { ascending: true });

    if (error) {
        console.error('Error fetching questions:', error);
        return [];
    }

    return questions;
}

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
    const { id: patientId, submissionId } = await params;
    const submission = await getSubmissionDetails(submissionId);

    if (!submission) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">ไม่พบข้อมูลการประเมิน</p>
                        <Link href={`/patient/${patientId}/home`}>
                            <Button className="mt-4">กลับไปหน้าหลัก</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const questions = await getFormQuestions(submission.form_id);
    const answers = submission.answers || {};

    const submittedDate = new Date(submission.submitted_at);

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <Link href={`/patient/${patientId}/home`}>
                    <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="h-4 w-4" />
                        กลับไปหน้าหลัก
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6">
                {/* Header Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl mb-2">{submission.forms?.title}</CardTitle>
                                <CardDescription>{submission.forms?.description}</CardDescription>
                            </div>
                            {submission.evaluation_result && (
                                <Badge className={`text-lg px-4 py-1 ${
                                    submission.evaluation_result.includes('ดี') ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                    submission.evaluation_result.includes('ปานกลาง') ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                    'bg-red-100 text-red-800 hover:bg-red-100'
                                }`}>
                                    {submission.evaluation_result}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {submittedDate.toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {submittedDate.toLocaleTimeString('th-TH', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })} น.
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{submission.patients?.first_name} {submission.patients?.last_name}</span>
                            </div>
                        </div>
                        
                        {submission.total_evaluation_score !== null && (
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">คะแนนรวม</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {submission.total_evaluation_score.toFixed(2)}
                                    </span>
                                </div>
                                {submission.evaluation_description && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {submission.evaluation_description}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Answers Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            รายละเอียดคำตอบ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {questions.map((question: any, index: number) => {
                            const answer = answers[question.question_id];
                            let displayAnswer = answer || '-';

                            // Format answer based on question type if needed
                            if (question.question_type === 'multiple_choice' || question.question_type === 'mcq') {
                                // Try to find the label if the answer is a value
                                if (question.options?.choices) {
                                    const choice = question.options.choices.find((c: any) => 
                                        (typeof c === 'string' ? c : c.value) === answer
                                    );
                                    if (choice) {
                                        displayAnswer = typeof choice === 'string' ? choice : choice.text || choice.label || choice.value;
                                    }
                                }
                            } else if (question.question_type === 'true_false' || question.question_type === 'trueFalse') {
                                if (answer === 'true') displayAnswer = 'ใช่ / จริง';
                                else if (answer === 'false') displayAnswer = 'ไม่ใช่ / ไม่จริง';
                            }

                            return (
                                <div key={question.question_id}>
                                    <div className="mb-2">
                                        <span className="font-medium text-muted-foreground mr-2">{index + 1}.</span>
                                        <span className="font-medium">{question.question_text}</span>
                                    </div>
                                    <div className="pl-6 p-3 bg-muted/30 rounded-md text-sm">
                                        {displayAnswer}
                                    </div>
                                    {index < questions.length - 1 && <Separator className="mt-6" />}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
