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
    User
} from 'lucide-react';
import { type FormSubmissionWithForm } from '@/app/service/patient';

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
                const IconComponent = getCategoryIcon('แบบประเมิน');
                const submittedDate = new Date(submission.submitted_at!);

                return (
                    <Card key={submission.id} className="opacity-90">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg text-muted-foreground">
                                        {submission.form.title}
                                    </CardTitle>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    เสร็จสิ้น
                                </Badge>
                            </div>
                            {submission.form.description && (
                                <CardDescription>{submission.form.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
