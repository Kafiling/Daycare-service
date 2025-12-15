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
import type { FormSubmissionWithForm } from '@/app/service/patient';
import { getCurrentUserProfile } from '@/app/service/nurse-client';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(buddhistEra);
dayjs.extend(relativeTime);
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
    submissions: FormSubmissionWithForm[];
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
        const lastSubmission = formSubmissions.length > 0 ? formSubmissions[formSubmissions.length - 1] : undefined;
        
        if (formSubmissions.length === 0) {
            return { status: 'available', message: 'พร้อมใช้งาน' };
        }

        if (!form.recurrence_schedule || form.recurrence_schedule.length === 0) {
            return { status: 'completed', message: 'ทำแบบประเมินแล้ว', lastSubmission };
        }

        // Use the first value in recurrence_schedule as the interval (in months)
        const interval = form.recurrence_schedule[0];
        const lastSubmissionDate = dayjs(lastSubmission!.submitted_at);
        const nextDueDate = lastSubmissionDate.add(interval, 'month');
        const now = dayjs();

        if (now.isAfter(nextDueDate) || now.isSame(nextDueDate, 'day')) {
             return { status: 'due', message: `ถึงกำหนดทำซ้ำ (ทุก ${interval} เดือน)`, lastSubmission };
        } else {
             return { 
                 status: 'upcoming', 
                 message: `ครั้งถัดไป: ${nextDueDate.format('D MMM BB')}`,
                 dueDate: nextDueDate,
                 lastSubmission
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
                // Always allow action if nurse is present, but style differently based on status
                const isActionable = true;

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
                                            disabled={!nurseId}
                                            title={!nurseId ? 'กำลังโหลดข้อมูลพยาบาล...' : ''}
                                            variant={status.status === 'due' || status.status === 'available' ? 'default' : 'outline'}
                                            className={status.status === 'due' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
                                        >
                                            {status.status === 'available' ? 'เริ่มประเมิน' : 'เริ่มประเมินอีกครั้ง'}
                                        </Button>
                                    </div>
                                </div>
                                {status.status !== 'available' && (
                                    <div className={`text-sm px-3 py-1.5 rounded-md flex items-center gap-2 ${
                                        status.status === 'due' ? 'bg-orange-100 text-orange-700' :
                                        status.status === 'upcoming' ? 'bg-blue-50 text-blue-700' :
                                        'bg-green-50 text-green-700'
                                    }`}>
                                        {status.status === 'due' && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                                        {status.status === 'upcoming' && <Clock className="h-4 w-4 flex-shrink-0" />}
                                        {status.status === 'completed' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                                        
                                        <div className="flex flex-col">
                                            <span className="font-medium">{status.message}</span>
                                            {status.lastSubmission && (
                                                <span className="text-xs opacity-90">
                                                    ล่าสุด: {dayjs(status.lastSubmission.submitted_at).format('D MMM BB')} 
                                                    {' '}({dayjs(status.lastSubmission.submitted_at).fromNow()})
                                                </span>
                                            )}
                                        </div>
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
