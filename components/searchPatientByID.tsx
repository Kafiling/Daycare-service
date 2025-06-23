"use client";

import { PatternFormat } from "react-number-format";
import { searchPatientByID } from "@/app/_actions/patientFormAction";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function PatientIdInput() {
  const router = useRouter();
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
        router.push(`/patient/${patient.id}/home`);
      }
    } catch (error) {

      console.error("พบปัญหาระหว่างค้นข้อมูลผู้ใช้บริการ : ", error);
      if (error == "Error: No patient found") {
        toast.warning("ไม่พบข้อมูลผู้ใช้บริการนี้ในระบบ",
          {
            duration: 5000,
            description: "กรุณาสร้างผู้ใช้บริการใหม่",
            action: {
              label: "สร้างผู้ใช้บริการใหม่",
              onClick: () => handleRedirectToCreatePatient(),
            }
          }
        );
      }
      else {
        console.log("Error fetching patient:", error);
        toast.error("เกิดข้อผิดพลาดในการค้นหาข้อมูลผู้ใช้บริการ"
          ,
          {
            description: String(error),
          }
        );

      }

      return;

    }
  }
  function handleRedirectToCreatePatient() {
    const formData = new FormData(document.querySelector("form")!);
    let patientID = formData.get("patientId") as string;
    patientID = patientID.replace(/-/g, ""); // Remove dashes
    router.push(`/patient-create?patientId=${patientID}`);
  }
  return (
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
  );
}
