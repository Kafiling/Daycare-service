'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Clock, Edit, FileText, Loader2, User, X } from 'lucide-react';
import QuestionRenderer from '@/components/question-types/QuestionRenderer';
import { toThaiDate, toThaiTimeShort } from '@/lib/timezone';
import { updateSubmission } from './_actions/updateSubmission';

const BANGKOK_TIMEZONE = 'Asia/Bangkok';

interface Props {
    submission: any;
    questions: any[];
    patientId: string;
    submissionId: string;
}

function toDatetimeLocalValue(isoString: string): string {
    // Format the UTC ISO string as a Bangkok-local datetime-local input value
    return formatInTimeZone(new Date(isoString), BANGKOK_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

function fromDatetimeLocalValue(localValue: string): string {
    // Interpret the datetime-local value as Bangkok time and return a UTC ISO string
    return fromZonedTime(new Date(localValue), BANGKOK_TIMEZONE).toISOString();
}

export default function EditSubmissionClient({ submission, questions, patientId, submissionId }: Props) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedAnswers, setEditedAnswers] = useState<Record<number, string>>({});
    const [editedDatetime, setEditedDatetime] = useState('');

    const answers = submission.answers || {};

    function startEditing() {
        setEditedAnswers({ ...answers });
        setEditedDatetime(toDatetimeLocalValue(submission.submitted_at));
        setIsEditing(true);
    }

    function cancelEditing() {
        setIsEditing(false);
    }

    async function handleSave() {
        setIsSaving(true);
        try {
            const utcDatetime = fromDatetimeLocalValue(editedDatetime);
            const result = await updateSubmission(
                submissionId,
                patientId,
                submission.form_id,
                editedAnswers,
                utcDatetime
            );
            if (result.success) {
                toast.success('บันทึกการแก้ไขเรียบร้อยแล้ว');
                setIsEditing(false);
                router.refresh();
            } else {
                toast.error(result.error || 'เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดที่ไม่คาดคิด');
        } finally {
            setIsSaving(false);
        }
    }

    const evaluationBadgeClass =
        submission.evaluation_result?.includes('ดี')
            ? 'bg-green-100 text-green-800 hover:bg-green-100'
            : submission.evaluation_result?.includes('ปานกลาง')
            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
            : 'bg-red-100 text-red-800 hover:bg-red-100';

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
                            <div className="flex items-center gap-2">
                                {submission.evaluation_result && (
                                    <Badge className={`text-lg px-4 py-1 ${evaluationBadgeClass}`}>
                                        {submission.evaluation_result}
                                    </Badge>
                                )}
                                {!isEditing && (
                                    <Button variant="outline" size="sm" onClick={startEditing} className="gap-1">
                                        <Edit className="h-4 w-4" />
                                        แก้ไข
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <div className="space-y-2">
                                <Label htmlFor="edit-datetime">วันและเวลาที่บันทึก (เวลาประเทศไทย)</Label>
                                <input
                                    id="edit-datetime"
                                    type="datetime-local"
                                    value={editedDatetime}
                                    onChange={(e) => setEditedDatetime(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{toThaiDate(submission.submitted_at)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{toThaiTimeShort(submission.submitted_at)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>
                                        บันทึกโดย: {submission.profiles?.title || ''}{' '}
                                        {submission.profiles?.first_name} {submission.profiles?.last_name}
                                    </span>
                                </div>
                            </div>
                        )}

                        {submission.total_evaluation_score !== null && (
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">คะแนนรวม</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {Number(submission.total_evaluation_score).toFixed(2)}
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
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                รายละเอียดคำตอบ
                            </CardTitle>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving} className="gap-1">
                                        <X className="h-4 w-4" />
                                        ยกเลิก
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1">
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : null}
                                        บันทึก
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {questions.map((question: any, index: number) => {
                            const answer = isEditing
                                ? (editedAnswers[question.question_id] ?? '')
                                : (answers[question.question_id]);

                            if (isEditing) {
                                return (
                                    <div key={question.question_id}>
                                        <div className="mb-3">
                                            <span className="font-medium text-muted-foreground mr-2">{index + 1}.</span>
                                            <span className="font-medium">{question.question_text}</span>
                                            {question.is_required && (
                                                <span className="text-destructive ml-1">*</span>
                                            )}
                                        </div>
                                        <div className="pl-6">
                                            <QuestionRenderer
                                                question={question}
                                                value={answer}
                                                onChange={(value) =>
                                                    setEditedAnswers((prev) => ({
                                                        ...prev,
                                                        [question.question_id]: value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        {index < questions.length - 1 && <Separator className="mt-6" />}
                                    </div>
                                );
                            }

                            let displayAnswer = answer || '-';
                            if (question.question_type === 'multiple_choice' || question.question_type === 'mcq') {
                                if (question.options?.choices) {
                                    const choice = question.options.choices.find((c: any) =>
                                        (typeof c === 'string' ? c : c.value) === answer
                                    );
                                    if (choice) {
                                        displayAnswer = typeof choice === 'string' ? choice : (choice.text || choice.label || choice.value);
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
                                    <div className="pl-6 p-3 bg-muted/30 rounded-md text-sm">{displayAnswer}</div>
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
