'use client';

import { useState } from 'react';
import { PatientListItem, restorePatient } from './_actions/patientActions';
import { toThaiDateTime } from '@/lib/timezone';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RotateCcw, Eye, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeletedPatientsTableProps {
  initialPatients: PatientListItem[];
}

export default function DeletedPatientsTable({ initialPatients }: DeletedPatientsTableProps) {
  const [patients, setPatients] = useState(initialPatients);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const router = useRouter();

  const calculateDaysRemaining = (scheduledDeleteAt?: string) => {
    if (!scheduledDeleteAt) return null;
    
    const deleteDate = new Date(scheduledDeleteAt);
    const now = new Date();
    const diffTime = deleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const handleRestore = async (patientId: string) => {
    setIsRestoring(patientId);
    try {
      const result = await restorePatient(patientId);
      
      if (result.success) {
        toast.success('คืนค่าข้อมูลผู้ใช้บริการเรียบร้อยแล้ว');
        setPatients(patients.filter(p => p.id !== patientId));
        router.refresh();
      } else {
        toast.error(result.error || 'ไม่สามารถคืนค่าข้อมูลได้');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการคืนค่าข้อมูล');
    } finally {
      setIsRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    return toThaiDateTime(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (patients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>ไม่มีข้อมูลผู้ใช้บริการที่ถูกลบ</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>รหัสผู้ใช้บริการ</TableHead>
            <TableHead>ชื่อ-นามสกุล</TableHead>
            <TableHead>วันเกิด</TableHead>
            <TableHead>เบอร์โทรศัพท์</TableHead>
            <TableHead>วันที่ลบ</TableHead>
            <TableHead>ลบถาวรใน</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => {
            const daysRemaining = calculateDaysRemaining(patient.scheduled_permanent_delete_at);
            
            return (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">{patient.id}</TableCell>
                <TableCell>{patient.full_name}</TableCell>
                <TableCell>
                  {patient.date_of_birth
                    ? formatDate(patient.date_of_birth)
                    : '-'}
                </TableCell>
                <TableCell>{patient.phone_num || '-'}</TableCell>
                <TableCell>
                  {patient.deleted_at ? formatDate(patient.deleted_at) : '-'}
                </TableCell>
                <TableCell>
                  {daysRemaining !== null ? (
                    <Badge 
                      variant={daysRemaining <= 7 ? 'destructive' : 'secondary'}
                      className="gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {daysRemaining} วัน
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* View Details Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          ดูข้อมูล
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>ข้อมูลผู้ใช้บริการ</DialogTitle>
                          <DialogDescription>
                            รายละเอียดของผู้ใช้บริการที่ถูกลบ
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                รหัสผู้ใช้บริการ
                              </p>
                              <p className="text-sm">{patient.id}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                ชื่อ-นามสกุล
                              </p>
                              <p className="text-sm">{patient.full_name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                วันเกิด
                              </p>
                              <p className="text-sm">
                                {patient.date_of_birth
                                  ? formatDate(patient.date_of_birth)
                                  : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                เบอร์โทรศัพท์
                              </p>
                              <p className="text-sm">{patient.phone_num || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                อีเมล
                              </p>
                              <p className="text-sm">{patient.email || '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                วันที่ลบ
                              </p>
                              <p className="text-sm">
                                {patient.deleted_at
                                  ? formatDate(patient.deleted_at)
                                  : '-'}
                              </p>
                            </div>
                          </div>
                          {daysRemaining !== null && (
                            <div className="border-t pt-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  ข้อมูลจะถูกลบถาวรใน: {daysRemaining} วัน
                                </span>
                              </div>
                              {patient.scheduled_permanent_delete_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  ({formatDate(patient.scheduled_permanent_delete_at)})
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Restore Confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm"
                          disabled={isRestoring === patient.id}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          คืนค่า
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ยืนยันการคืนค่าข้อมูล</AlertDialogTitle>
                          <AlertDialogDescription>
                            คุณต้องการคืนค่าข้อมูลของ {patient.full_name} (รหัส: {patient.id}) หรือไม่?
                            <br /><br />
                            ข้อมูลจะกลับมาแสดงในระบบอีกครั้ง
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRestore(patient.id)}
                            disabled={isRestoring === patient.id}
                          >
                            {isRestoring === patient.id ? 'กำลังคืนค่า...' : 'ยืนยันคืนค่า'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
