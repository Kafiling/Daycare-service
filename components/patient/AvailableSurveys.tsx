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
    User
} from 'lucide-react';
import {
    getOrCreateFormResponse,
    getFirstQuestionByFormId,
    type Form
} from '@/app/service/patient-client';
import { getCurrentUserProfile } from '@/app/service/nurse-client';

// Icon mapping for form categories
const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
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
            return User;
        default:
            return FileText;
    }
};

// Priority mapping for forms
const getFormPriority = (formId: string) => {
    // For UUID form_ids, we can use a different logic
    // Perhaps based on form title or creation date
    // For now, returning 'medium' as default
    return 'medium';
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'high': return 'destructive';
        case 'medium': return 'default';
        case 'low': return 'secondary';
        default: return 'default';
    }
};

interface AvailableSurveysProps {
    patientId: string;
    forms: Form[];
}

export default function AvailableSurveys({ patientId, forms }: AvailableSurveysProps) {
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
                const IconComponent = getCategoryIcon('แบบประเมิน');
                const priority = getFormPriority(form.form_id);
                return (
                    <Card key={form.form_id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <IconComponent className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">{form.title}</CardTitle>
                                </div>
                                <Badge variant={getPriorityColor(priority) as any}>
                                    {priority === 'high' ? 'สำคัญ' :
                                        priority === 'medium' ? 'ปกติ' : 'ไม่เร่งด่วน'}
                                </Badge>
                            </div>
                            {form.description && (
                                <CardDescription>{form.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        15 นาที
                                    </div>
                                    <Badge variant="outline">แบบประเมิน</Badge>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleStartSurvey(form.form_id)}
                                    disabled={!nurseId}
                                    title={!nurseId ? 'กำลังโหลดข้อมูลพยาบาล...' : ''}
                                >
                                    เริ่มประเมิน
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
