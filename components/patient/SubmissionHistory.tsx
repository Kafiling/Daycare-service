'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Heart, Activity, AlertCircle, User, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { FormSubmissionWithForm } from '@/app/service/patient';

interface SubmissionHistoryProps {
    submissions: FormSubmissionWithForm[];
}

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

export default function SubmissionHistory({ submissions }: SubmissionHistoryProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    
    const totalPages = Math.ceil(submissions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSubmissions = submissions.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const goToPrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    if (submissions.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-lg text-muted-foreground">
                        ยังไม่มีประวัติการส่งแบบประเมิน
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        ผู้ใช้บริการยังไม่เคยส่งแบบประเมินใดๆ
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Submissions List */}
            <div className="space-y-4">
                {currentSubmissions.map((submission, index) => {
                    const IconComponent = getCategoryIcon(submission.form?.label);
                    const submittedDate = new Date(submission.submitted_at || new Date());

                    return (
                        <div key={submission.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                                    <CheckCircle 
                                        className={`h-4 w-4 ${
                                            submission.evaluation_result === "ต้องปรับปรุง" || 
                                            submission.evaluation_result === "ปานกลาง" 
                                                ? "text-yellow-500" 
                                                : "text-green-600"
                                        }`} 
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium">{submission.form?.title || 'แบบประเมิน'}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {submission.form?.label && (
                                            <span>หมวด: {submission.form.label}</span>
                                        )}
                                        <span>คะแนน: {typeof submission.total_evaluation_score === 'number' ? submission.total_evaluation_score.toFixed(2) : '0.00'}</span>
                                        {submission.evaluation_result && (
                                            <span>ผล: {submission.evaluation_result}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="text-sm text-muted-foreground text-right">
                                    <p>
                                        {submittedDate.toLocaleDateString('th-TH', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-xs">
                                        {submittedDate.toLocaleTimeString('th-TH', {
                                            timeZone: 'Asia/Bangkok',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        })} น.
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        แสดง {startIndex + 1}-{Math.min(endIndex, submissions.length)} จาก {submissions.length} รายการ
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPrevious}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => goToPage(page)}
                                    className="h-8 w-8 p-0"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNext}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
