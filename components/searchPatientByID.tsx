"use client";

import { PatternFormat } from "react-number-format";
import { searchPatientByID } from "@/app/(main)/_actions/patientFormAction";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PatientIdInput() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState("");
  const [showDeletedDialog, setShowDeletedDialog] = useState(false);
  const [deletedPatientInfo, setDeletedPatientInfo] = useState<{
    scheduledDeleteAt: string;
    daysRemaining: number;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    let patientID = formData.get("patientId") as string;
    patientID = patientID.replace(/-/g, ""); // Remove dashes

    if (patientID.length !== 13) {
      toast.error("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
      return;
    }

    try {
      const patient = await searchPatientByID(patientID);

      if (patient && patient.id) {
        // Check if patient is soft deleted
        if (patient.isSoftDeleted) {
          const deletionDate = new Date(patient.scheduled_permanent_delete_at);
          const daysRemaining = Math.ceil((deletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          setDeletedPatientInfo({
            scheduledDeleteAt: deletionDate.toLocaleDateString('th-TH', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            daysRemaining,
          });
          setShowDeletedDialog(true);
          return;
        }
        
        router.push(`/patient/${patient.id}/home`);
      } else {
        // Show dialog instead of toast
        setCurrentPatientId(patientID);
        setShowDialog(true);
      }
    } catch (error) {
      console.error("พบปัญหาระหว่างค้นข้อมูลผู้ใช้บริการ : ", error);
      toast.error("เกิดข้อผิดพลาดในการค้นหาข้อมูลผู้ใช้บริการ", {
        description: String(error),
      });
    }
  }

  function handleCreateNewPatient() {
    setShowDialog(false);
    router.push(`/patient-create?patientId=${currentPatientId}`);
  }

  function handleCloseDialog() {
    setShowDialog(false);
    setCurrentPatientId("");
  }

  return (
    <>
      <form className="flex items-end" onSubmit={handleSubmit}>
        <div className="flex-1">
          <Label htmlFor="patientId" className="py-2">
            เลขบัตรประชาชน 13 หลัก (Thai ID)
          </Label>
          <PatternFormat
            id="patientId"
            name="patientId"
            format="#-####-#####-##-#"
            mask="_"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Button type="submit" className="mx-2 h-auto">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ไม่พบข้อมูลผู้ใช้บริการ
            </DialogTitle>
            <DialogDescription>
              ไม่พบข้อมูลผู้ใช้บริการนี้ในระบบ กรุณาสร้างผู้ใช้บริการใหม่
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              เลขบัตรประชาชน: <span className="font-medium">{currentPatientId}</span>
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateNewPatient} className="gap-2">
              <Plus className="h-4 w-4" />
              สร้างผู้ใช้บริการใหม่
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeletedDialog} onOpenChange={setShowDeletedDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              ผู้ใช้บริการถูกลบโดยผู้ดูแลระบบ
            </DialogTitle>
            <DialogDescription>
              ข้อมูลผู้ใช้บริการนี้ถูกลบโดยผู้ดูแลระบบแล้ว
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-900 mb-2">
                ข้อมูลจะถูกลบถาวรในอีก {deletedPatientInfo?.daysRemaining} วัน
              </p>
              <p className="text-sm text-red-700">
                วันที่ลบถาวร: {deletedPatientInfo?.scheduledDeleteAt}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              กรุณาติดต่อผู้ดูแลระบบเพื่อขอข้อมูลเพิ่มเติม
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDeletedDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
