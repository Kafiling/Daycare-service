"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Clock,
    Heart,
    Activity,
    AlertCircle,
    User,
    CheckCircle2,
    History
} from 'lucide-react';
import Link from 'next/link';
import {
    getOrCreateFormResponse,
    getFirstQuestionByFormId,
    type Form
} from '@/app/service/patient-client';
import type { Submission } from '@/app/service/patient';
import { getCurrentUserProfile } from '@/app/service/nurse-client';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

// Icon mapping for form categories
const getCategoryIcon = (label: string) => {
    switch (label?.toLowerCase()) {
        case 'สุขภาพทั่วไป':
        case 'สุขภาพ':
            return Heart;
        case 'สุขภาพจิต':
        case 'จิตใจ':
            return Activity;
        case 'ความปลอดภัย':
        case 'ปลอดภัย':
            return AlertCircle;
        case 'กิจกรรมประจำวัน':
        case 'กิจกรรม':
        case 'การดูแล':
            return User;
        default:
            return FileText;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case 'urgent': return 'destructive';
        case 'high': return 'destructive';
        case 'medium': return 'default';
        case 'low': return 'secondary';
        default: return 'default';
    }
};

const getPriorityLabel = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case 'urgent': return 'เร่งด่วน';
        case 'high': return 'สำคัญ';
        case 'medium': return 'ปกติ';
        case 'low': return 'ไม่เร่งด่วน';
        default: return 'ปกติ';
    }
};

interface AvailableSurveysProps {
    patientId: string;
    forms: Form[];
    submissions: Submission[];
}

export default function AvailableSurveys({ patientId, forms, submissions }: AvailableSurveysProps) {
    const router = useRouter();
    const [nurseId, setNurseId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Get nurse profile on component mount
    useEffect(() => {
        const fetchNurseProfile = async () => {
            try {
                const profile = await getCurrentUserProfile();
                if (profile) {
                    setNurseId(profile.id);
                } else {
                    console.warn('No nurse profile found');
                }
            } catch (error) {
                console.error('Error fetching nurse profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNurseProfile();
    }, []);

    const getFormStatus = (form: Form) => {
        const formSubmissions = submissions.filter(s => s.form_id === form.form_id).sort((a, b) => new Date(a.submitted_at!).getTime() - new Date(b.submitted_at!).getTime());
        
        if (formSubmissions.length === 0) {
            return { status: 'available', message: 'พร้อมใช้งาน' };
        }

        if (!form.recurrence_schedule || form.recurrence_schedule.length === 0) {
            return { status: 'completed', message: 'ทำแบบประเมินแล้ว' };
        }

        const firstSubmission = formSubmissions[0];
        const submissionCount = formSubmissions.length;
        
        // Check if there are more recurrences scheduled
        if (submissionCount > form.recurrence_schedule.length) {
             return { status: 'completed', message: 'ครบกำหนดการแล้ว' };
        }

        const nextInterval = form.recurrence_schedule[submissionCount - 1];
        const firstSubmissionDate = dayjs(firstSubmission.submitted_at);
        const nextDueDate = firstSubmissionDate.add(nextInterval, 'month');
        const now = dayjs();

        if (now.isAfter(nextDueDate) || now.isSame(nextDueDate, 'day')) {
             return { status: 'due', message: `ถึงกำหนดทำซ้ำ (เดือนที่ ${nextInterval})` };
        } else {
             return { 
                 status: 'upcoming', 
                 message: `ครั้งถัดไป: ${nextDueDate.format('D MMM BB')}`,
                 dueDate: nextDueDate
             };
        }
    };

    const handleStartSurvey = async (formId: string) => {
        if (!nurseId) {
            alert('ไม่สามารถระบุตัวตนของพยาบาลได้ กรุณาเข้าสู่ระบบใหม่');
            return;
        }

        try {
            // Create or get existing form response with real nurse ID
            const submissionId = await getOrCreateFormResponse(patientId, formId, nurseId);

            // Get first question for this form
            const firstQuestion = await getFirstQuestionByFormId(formId);

            if (firstQuestion) {
                router.push(`/patient/${patientId}/${formId}/${firstQuestion.question_id}`);
            } else {
                console.error('No questions found for this form');
                alert('ไม่พบคำถามในแบบประเมินนี้');
            }
        } catch (err) {
            console.error('Error starting survey:', err);
            alert('เกิดข้อผิดพลาดในการเริ่มแบบประเมิน');
        }
    };

    if (forms.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ไม่มีแบบประเมินที่พร้อมใช้งานในขณะนี้</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>กำลังโหลด...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forms.map((form) => {
                const IconComponent = getCategoryIcon(form.label || 'แบบประเมิน');
                const priority = form.priority_level || 'medium';
                const timeToComplete = form.time_to_complete || 15;
                
                const status = getFormStatus(form);
                const isActionable = status.status === 'available' || status.status === 'due';

                return (
                    <Card key={form.form_id} className={`hover:shadow-md transition-shadow ${status.status === 'due' ? 'border-orange-300 bg-orange-50' : ''}`}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <IconComponent className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">{form.title}</CardTitle>
                                </div>
                                <Badge variant={getPriorityColor(priority) as any}>
                                    {getPriorityLabel(priority)}
                                </Badge>
                            </div>
                            {form.description && (
                                <CardDescription>{form.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {timeToComplete} นาที
                                        </div>
                                        {form.label && (
                                            <Badge variant="outline">{form.label}</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {status.lastSubmission && (
                                            <Link href={`/patient/${patientId}/history/${status.lastSubmission.id}`}>
                                                <Button size="sm" variant="outline" title="ดูประวัติล่าสุด">
                                                    <History className="h-4 w-4 mr-1" />
                                                    ประวัติ
                                                </Button>
                                            </Link>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={() => handleStartSurvey(form.form_id)}
                                            disabled={!nurseId || !isActionable}
                                            title={!nurseId ? 'กำลังโหลดข้อมูลพยาบาล...' : ''}
                                            variant={status.status === 'due' ? 'default' : isActionable ? 'default' : 'secondary'}
                                        >
                                            {status.status === 'due' ? 'ทำซ้ำ' : 'เริ่มประเมิน'}
                                        </Button>
                                    </div>
                                </div>
                                {status.status !== 'available' && (
                                    <div className={`text-sm px-3 py-1.5 rounded-md flex items-center gap-2 ${
                                        status.status === 'due' ? 'bg-orange-100 text-orange-700' :
                                        status.status === 'upcoming' ? 'bg-blue-50 text-blue-700' :
                                        'bg-green-50 text-green-700'
                                    }`}>
                                        {status.status === 'due' && <AlertCircle className="h-4 w-4" />}
                                        {status.status === 'upcoming' && <Clock className="h-4 w-4" />}
                                        {status.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                                        {status.message}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
