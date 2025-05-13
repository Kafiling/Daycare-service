"use client";
import React from "react";
import { toast } from "sonner";
import { PatternFormat } from "react-number-format";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function PatientCreateForm(patientId: any) {
  let patientID: string = patientId.patientId || "";
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
  }
  return (
    <>
      <form className="flex items-end " onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="grid md:col-span-2 ">
            <Label htmlFor="patientId" className="py-2">
              เลขบัตรประชาชน 13 หลัก (Thai ID)
            </Label>
            <PatternFormat
              id="patientId"
              name="patientId"
              format="#-####-#####-##-#"
              mask="_"
              value={patientID}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid col-span-1">
              <Label htmlFor="patientId" className="py-2">
                คำนำหน้าชื่อ
              </Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="คำนำหน้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">นาย</SelectItem>
                  <SelectItem value="dark">นาง</SelectItem>
                  <SelectItem value="system">นางสาว</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid col-span-2">
              <Label htmlFor="patientId" className="py-2">
                ชื่อ (First Name)
              </Label>

              <Input type="email" placeholder="Email" />
            </div>
          </div>
          <div className="grid">
            <Label htmlFor="patientId" className="py-2">
              นามสกุล (Last Name)
            </Label>

            <Input type="email" placeholder="Email" />
          </div>
        </div>
      </form>
    </>
  );
}

export default PatientCreateForm;
