import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import EditSubmissionClient from './EditSubmissionClient';

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
            ),
            profiles (
                id,
                first_name,
                last_name,
                title,
                position
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

    return (
        <EditSubmissionClient
            submission={submission}
            questions={questions}
            patientId={patientId}
            submissionId={submissionId}
        />
    );
}
