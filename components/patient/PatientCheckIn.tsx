'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, History, Clock } from "lucide-react";
import { checkInPatientAction } from "@/app/(main)/patient/[id]/home/_actions/checkin";
import { toast } from "sonner";
import type { CheckIn } from "@/app/service/checkin";

interface PatientCheckInProps {
  patientId: string;
  todayCheckIn: CheckIn | null;
  history: CheckIn[];
}

export function PatientCheckIn({ patientId, todayCheckIn, history }: PatientCheckInProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      const result = await checkInPatientAction(patientId);
      if (result.success) {
        toast.success("เช็คอินสำเร็จ");
      } else {
        toast.error("เช็คอินล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
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
    <div className="flex gap-2">
      {todayCheckIn ? (
        <Button variant="outline" className="gap-2 cursor-default hover:bg-background text-green-600 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          เช็คอินแล้ว ({new Date(todayCheckIn.check_in_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })})
        </Button>
      ) : (
        <Button onClick={handleCheckIn} disabled={isLoading} className="gap-2 bg-green-600 hover:bg-green-700">
          <Clock className="h-4 w-4" />
          {isLoading ? "กำลังเช็คอิน..." : "เช็คอิน"}
        </Button>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" />
            ประวัติ
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ประวัติการเช็คอิน</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">ไม่พบประวัติการเช็คอิน</p>
            ) : (
              <div className="space-y-2">
                {history.map((checkIn) => (
                  <div key={checkIn.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">เช็คอิน</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(checkIn.check_in_time)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
