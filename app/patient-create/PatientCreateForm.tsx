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
  const [formData, setFormData] = React.useState({
    patientId: patientID,
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }

  return (
    <>
      <form className="flex flex-col items-end " onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <h2 className="text font-bold py-4 md:col-span-2 flex items-center gap-2 ">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0 ">
              1
            </span>
            ข้อมูลผู้ป่วย (Patient Information)
          </h2>
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
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid col-span-1">
              <Label htmlFor="patientId" className="py-2">
                คำนำหน้าชื่อ
              </Label>
              <Select>
                <SelectTrigger className="w-full" name="title">
                  <SelectValue placeholder="คำนำหน้า" />
                </SelectTrigger>
                <SelectContent onChange={handleChange}>
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
              <Input
                type="text"
                placeholder="ชื่อ"
                name="first_name"
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid">
            <Label htmlFor="patientId" className="py-2">
              นามสกุล (Last Name)
            </Label>
            <Input
              type="text"
              placeholder="นามสกุล"
              name="last_name"
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label htmlFor="patientId" className="py-2">
              วันเกิด (Date of Birth)
            </Label>
            <Input type="text" placeholder="นามสกุล" onChange={handleChange} />
          </div>
          <div className="grid">
            <Label htmlFor="patientId" className="py-2">
              เบอร์โทรศัพท์ (Phone Number)
            </Label>
            <PatternFormat
              id="phone_num"
              name="phone_num"
              format="###-###-####"
              mask="_"
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid">
            <Label htmlFor="patientId" className="py-2">
              อีเมล (Email){" "}
              <span className="text-sm text-muted-foreground">
                (หากไม่มีให้เว้นว่าง)
              </span>
            </Label>
            <Input
              type="email"
              placeholder="อีเมล"
              name="email"
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label htmlFor="weight" className="py-2">
              น้ำหนัก (Weight){" "}
              <span className="text-sm text-muted-foreground">(หน่วย kg)</span>
            </Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.01"
              placeholder="น้ำหนัก (kg)"
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label htmlFor="height" className="py-2">
              ส่วนสูง (Height)
              <span className="text-sm text-muted-foreground">(หน่วย cm)</span>
            </Label>
            <Input
              id="height"
              name="height"
              type="number"
              step="0.01"
              placeholder="ส่วนสูง (cm)"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <h2 className="text font-bold py-4 md:col-span-2 flex items-center gap-2 ">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0 ">
              2
            </span>
            ข้อมูลการรักษา (Medical Information)
          </h2>
        </div>
      </form>
    </>
  );
}

export default PatientCreateForm;
