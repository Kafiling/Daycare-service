"use client";

import { PatternFormat } from "react-number-format";
import { searchPatientByID } from "@/app/_actions/patientFormAction";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function PatientIdInput() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    let patientID = formData.get("patientId") as string;
    patientID = patientID.replace(/-/g, ""); // Remove dashes
    if (patientID.length !== 13) {
      toast.error("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
      return;
    }
    const patient = searchPatientByID(patientID);
    if (!patient) {
      toast.error("ไม่พบข้อมูลผู้ป่วย");
      return;
    }
    toast("พบข้อมูลผู้ป่วย");
    // Redirect to the patient detail page
    redirect(`/patient/${patientID}`);
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
      <Button type="submit">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </form>
  );
}
