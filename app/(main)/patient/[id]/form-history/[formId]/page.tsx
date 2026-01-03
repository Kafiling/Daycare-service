import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPatientById } from '@/app/service/patient';
import { getFormSubmissionHistory, getFormDetails } from './_actions/getFormHistory';
import FormHistoryTable from './FormHistoryTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Clock, Tag, Calendar, Repeat, User } from 'lucide-react';
import Link from 'next/link';

interface FormHistoryPageProps {
  params: Promise<{
    id: string;
    formId: string;
  }>;
}

const getPriorityColor = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'default';
  }
};

const getPriorityLabel = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 'เร่งด่วน';
    case 'high': return 'สำคัญ';
    case 'medium': return 'ปกติ';
    case 'low': return 'ไม่เร่งด่วน';
    default: return 'ปกติ';
  }
};

const getRecurrenceLabel = (schedule?: number[]) => {
  if (!schedule || schedule.length === 0 || schedule[0] === 0) {
    return 'ทำครั้งเดียว';
  }
  const interval = schedule[0];
  if (interval === 0.5) return 'ทุก 2 สัปดาห์';
  return `ทุก ${interval} เดือน`;
};

export default async function FormHistoryPage({ params }: FormHistoryPageProps) {
  const { id: patientId, formId } = await params;

  // Fetch patient, form details, and submissions
  const patient = await getPatientById(patientId);
  if (!patient) {
    notFound();
  }

  const [formDetails, submissions] = await Promise.all([
    getFormDetails(formId),
    getFormSubmissionHistory(patientId, formId)
  ]);

  if (!formDetails) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href={`/patient/${patientId}/home`}>
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้าผู้ใช้บริการ
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">ประวัติการทำแบบประเมิน</h1>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <p className="text-primary text-lg font-medium">
            {patient.full_name}
          </p>
        </div>
      </div>

      {/* Form Information Card */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{formDetails.title}</CardTitle>
              {formDetails.description && (
                <CardDescription className="text-base">
                  {formDetails.description}
                </CardDescription>
              )}
            </div>
            <Badge variant={getPriorityColor(formDetails.priority_level) as any} className="ml-4">
              {getPriorityLabel(formDetails.priority_level)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            {formDetails.label && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">หมวดหมู่:</span>
                <Badge variant="outline">{formDetails.label}</Badge>
              </div>
            )}
            {formDetails.time_to_complete && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">เวลาในการทำ:</span>
                <span className="font-medium">{formDetails.time_to_complete} นาที</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">ระยะเวลาทำซ้ำ:</span>
              <span className="font-medium">{getRecurrenceLabel(formDetails.recurrence_schedule)}</span>
            </div>
            
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติการส่งแบบประเมิน</CardTitle>
          <CardDescription>
            แสดงประวัติการทำแบบประเมินทั้งหมด เรียงจากล่าสุดไปเก่าสุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">กำลังโหลด...</div>}>
            <FormHistoryTable submissions={submissions} patientId={patientId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
