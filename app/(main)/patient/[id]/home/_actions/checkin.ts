'use server'

import { checkInPatient } from "@/app/service/checkin";
import { revalidatePath } from "next/cache";

export async function checkInPatientAction(patientId: string) {
  try {
    await checkInPatient(patientId);
    revalidatePath(`/patient/${patientId}/home`);
    return { success: true };
  } catch (error) {
    console.error('Check-in failed:', error);
    return { success: false, error: 'Check-in failed' };
  }
}
