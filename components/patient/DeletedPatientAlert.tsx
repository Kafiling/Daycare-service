'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface DeletedPatientAlertProps {
  patientName: string;
  deletedAt: string;
}

export default function DeletedPatientAlert({ patientName, deletedAt }: DeletedPatientAlertProps) {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect after component mounts
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleGoHome = () => {
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            ไม่สามารถเข้าถึงข้อมูลได้
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                ข้อมูลของ <span className="font-semibold text-foreground">{patientName}</span> ถูกลบออกจากระบบแล้ว
              </p>
              <p className="text-sm">
                ลบเมื่อ: <span className="font-medium">{formatDate(deletedAt)}</span>
              </p>
              <p className="text-orange-600">
                ⚠️ ข้อมูลนี้จะถูกลบถาวรอัตโนมัติหลังจาก 3 เดือน
              </p>
              <p className="text-xs text-muted-foreground">
                หากต้องการกู้คืนข้อมูล กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleGoHome}>
            กลับหน้าหลัก
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
