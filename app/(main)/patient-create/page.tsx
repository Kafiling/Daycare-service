import React from "react";
import PatientCreateForm from "./PatientCreateForm";

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
      <h1 className="text-2xl font-bold text-white bg-pink-400 p-8">
        เพิ่มผู้ใช้บริการใหม่
      </h1>
      <main className="container mx-auto p-8 space-y-8">
        <PatientCreateForm patientId={patientId} />
      </main>
    </div>
  );
}
