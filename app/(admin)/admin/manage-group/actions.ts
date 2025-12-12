'use server';

import { requireAdmin } from '../lib/auth';
import {
    createPatientGroup as createPatientGroupClient,
    updatePatientGroup as updatePatientGroupClient,
    deletePatientGroup as deletePatientGroupClient,
    createGroupAssignmentRule as createGroupAssignmentRuleClient,
    updateGroupAssignmentRule as updateGroupAssignmentRuleClient,
    deleteGroupAssignmentRule as deleteGroupAssignmentRuleClient,
    PatientGroup,
    GroupAssignmentRule,
} from '@/app/service/group-assignment';

interface ActionResult<T = any> {
    success: boolean;
    error?: string;
    data?: T;
}

/**
 * Create a new patient group (admin only)
 */
export async function createPatientGroup(
    group: Omit<PatientGroup, 'id' | 'created_at' | 'updated_at'>
): Promise<ActionResult<PatientGroup>> {
    try {
        await requireAdmin();
        const data = await createPatientGroupClient(group);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create patient group' };
    }
}

/**
 * Update a patient group (admin only)
 */
export async function updatePatientGroup(
    id: string,
    updates: Partial<Omit<PatientGroup, 'id' | 'created_at' | 'updated_at'>>
): Promise<ActionResult<PatientGroup>> {
    try {
        await requireAdmin();
        const data = await updatePatientGroupClient(id, updates);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update patient group' };
    }
}

/**
 * Delete a patient group (admin only)
 */
export async function deletePatientGroup(id: string): Promise<ActionResult> {
    try {
        await requireAdmin();
        await deletePatientGroupClient(id);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to delete patient group' };
    }
}

/**
 * Create a new group assignment rule (admin only)
 */
export async function createGroupAssignmentRule(
    rule: Omit<GroupAssignmentRule, 'id' | 'created_at' | 'updated_at' | 'group'>
): Promise<ActionResult<GroupAssignmentRule>> {
    try {
        await requireAdmin();
        const data = await createGroupAssignmentRuleClient(rule);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to create assignment rule' };
    }
}

/**
 * Update a group assignment rule (admin only)
 */
export async function updateGroupAssignmentRule(
    id: string,
    updates: Partial<Omit<GroupAssignmentRule, 'id' | 'created_at' | 'updated_at' | 'group'>>
): Promise<ActionResult<GroupAssignmentRule>> {
    try {
        await requireAdmin();
        const data = await updateGroupAssignmentRuleClient(id, updates);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update assignment rule' };
    }
}

/**
 * Delete a group assignment rule (admin only)
 */
export async function deleteGroupAssignmentRule(id: string): Promise<ActionResult> {
    try {
        await requireAdmin();
        await deleteGroupAssignmentRuleClient(id);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to delete assignment rule' };
    }
}
