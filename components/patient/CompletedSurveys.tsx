import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Clock,
    CheckCircle,
    Heart,
    Activity,
    AlertCircle,
    User,
    Timer,
    Flag
} from 'lucide-react';
import { type FormSubmissionWithForm } from '@/app/service/patient';

// Priority level mapping
const getPriorityConfig = (priority?: string) => {
    switch (priority) {
        case 'high':
            return { variant: 'destructive' as const, label: 'สำคัญมาก', icon: Flag };
        case 'medium':
            return { variant: 'default' as const, label: 'สำคัญปานกลาง', icon: Flag };
        case 'low':
            return { variant: 'secondary' as const, label: 'สำคัญน้อย', icon: Flag };
        default:
            return { variant: 'outline' as const, label: 'ไม่ระบุ', icon: Flag };
    }
};

// Icon mapping for form categories
const getCategoryIcon = (label?: string) => {
    if (!label) return FileText;
    
    switch (label.toLowerCase()) {
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

interface CompletedSurveysProps {
    submissions: FormSubmissionWithForm[];
}

export default function CompletedSurveys({ submissions }: CompletedSurveysProps) {
    if (submissions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่มีแบบประเมินที่เสร็จสิ้น</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((submission) => {
                const IconComponent = getCategoryIcon(submission.form.label);
                const submittedDate = new Date(submission.submitted_at!);
                const priorityConfig = getPriorityConfig(submission.form.priority_level);
                const PriorityIcon = priorityConfig.icon;

                return (
                    <Card key={submission.id} className="opacity-90">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-lg text-muted-foreground">
                                            {submission.form.title}
                                        </CardTitle>
                                        {submission.form.label && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {submission.form.label}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={priorityConfig.variant} className="text-xs">
                                        <PriorityIcon className="h-3 w-3 mr-1" />
                                        {priorityConfig.label}
                                    </Badge>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        เสร็จสิ้น
                                    </Badge>
                                </div>
                            </div>
                            {submission.form.description && (
                                <CardDescription>{submission.form.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    {submission.form.time_to_complete && (
                                        <div className="flex items-center gap-1">
                                            <Timer className="h-4 w-4" />
                                            {submission.form.time_to_complete} นาที
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        เสร็จเมื่อ {submittedDate.toLocaleDateString('th-TH', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" disabled>
                                    ดูผลลัพธ์
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
