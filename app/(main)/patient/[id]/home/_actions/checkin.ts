'use server'

import { checkInPatient } from "@/app/service/checkin";
import { revalidatePath } from "next/cache";

export async function checkInPatientAction(
  patientId: string,
  vitals?: { systolic_bp?: number; diastolic_bp?: number; heart_rate?: number }
) {
  try {
    await checkInPatient(patientId, vitals);
    revalidatePath(`/patient/${patientId}/home`);
    return { success: true };
  } catch (error) {
    console.error('Check-in failed:', error);
    return { success: false, error: 'Check-in failed' };
  }
}
