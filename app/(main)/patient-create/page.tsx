import React from "react";
import PatientCreateForm from "./PatientCreateForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Get patientId from query by properly unwrapping the searchParams
  const { patientId: rawPatientId = "" } = await searchParams;
  const patientId = Array.isArray(rawPatientId) ? rawPatientId[0] : rawPatientId;
  console.log("patientId", patientId);
  return (
    <div className="min-h-screen bg-background">
      {/* TODO -> replace this into Header component */}
      <div className="p-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          เพิ่มผู้ใช้บริการใหม่
        </h1>
      </div>
      <main className="container mx-auto p-8 space-y-8">
        <PatientCreateForm patientId={patientId} />
      </main>
    </div>
  );
}
