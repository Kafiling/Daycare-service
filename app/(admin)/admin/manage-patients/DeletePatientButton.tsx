'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { softDeletePatient } from './_actions/patientActions';
import { toast } from 'sonner';

interface DeletePatientButtonProps {
  patientId: string;
  patientName: string;
}

export default function DeletePatientButton({ patientId, patientName }: DeletePatientButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await softDeletePatient(patientId);
      if (result.success) {
        toast.success('ลบข้อมูลผู้ใช้บริการสำเร็จ');
        setIsOpen(false);
      } else {
        toast.error(`ลบข้อมูลล้มเหลว: ${result.error}`);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        ลบ
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบข้อมูลผู้ใช้บริการ</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  คุณต้องการลบข้อมูลของ <span className="font-semibold text-foreground">{patientName}</span> ใช่หรือไม่?
                </p>
                <p className="text-orange-600 dark:text-orange-400">
                  ⚠️ ข้อมูลจะถูกลบแบบชั่วคราว และจะถูกลบถาวรอัตโนมัติหลังจาก 3 เดือน
                </p>
                <p className="text-sm">
                  รหัสผู้ใช้บริการ: <span className="font-mono">{patientId}</span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                'ยืนยันการลบ'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
