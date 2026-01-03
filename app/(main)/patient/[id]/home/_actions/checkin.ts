'use server'

import { checkInPatient, updateCheckIn } from "@/app/service/checkin";
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

export async function updateCheckInAction(
  patientId: string,
  checkInId: string,
  vitals: { systolic_bp?: number; diastolic_bp?: number; heart_rate?: number }
) {
  try {
    await updateCheckIn(checkInId, vitals);
    revalidatePath(`/patient/${patientId}/home`);
    return { success: true };
  } catch (error) {
    console.error('Update check-in failed:', error);
    return { success: false, error: 'Update check-in failed' };
  }
}
