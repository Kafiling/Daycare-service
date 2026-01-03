'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { FormSubmissionWithForm } from '@/app/service/patient';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface FormHistoryTableProps {
  submissions: FormSubmissionWithForm[];
  patientId: string;
}

const getResultBadgeVariant = (result?: string) => {
  if (!result) return 'secondary';
  
  const resultLower = result.toLowerCase();
  if (resultLower.includes('ปกติ') || resultLower.includes('ดี')) {
    return 'default';
  }
  if (resultLower.includes('เสี่ยง') || resultLower.includes('ระวัง')) {
    return 'destructive';
  }
  return 'secondary';
};

export default function FormHistoryTable({ submissions, patientId }: FormHistoryTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>ยังไม่มีประวัติการทำแบบประเมินนี้</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>วันที่ส่ง</TableHead>
            <TableHead>เวลา</TableHead>
            <TableHead>ผลการประเมิน</TableHead>
            <TableHead className="text-center">คะแนน</TableHead>
            <TableHead>คำอธิบาย</TableHead>
            <TableHead className="text-right">การดำเนินการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission, index) => {
            const submittedDate = dayjs(submission.submitted_at);
            
            return (
              <TableRow key={submission.id} className="hover:bg-muted/50">
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  {submittedDate.format('D MMMM BBBB')}
                </TableCell>
                <TableCell>
                  {submittedDate.format('HH:mm น.')}
                </TableCell>
                <TableCell>
                  {submission.evaluation_result ? (
                    <Badge variant={getResultBadgeVariant(submission.evaluation_result) as any}>
                      {submission.evaluation_result}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {submission.total_evaluation_score !== null && 
                   submission.total_evaluation_score !== undefined ? (
                    <span className="font-semibold">
                      {submission.total_evaluation_score}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    {submission.evaluation_description ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {submission.evaluation_description}
                      </p>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/patient/${patientId}/history/${submission.id}`}>
                    <Button size="sm" variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      ดูรายละเอียด
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
