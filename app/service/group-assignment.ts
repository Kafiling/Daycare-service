import { createClient } from '@/utils/supabase/client';

export interface PatientGroup {
    id: string;
    name: string;
    description?: string;
    color?: string;
    created_at: string;
    updated_at: string;
}

export interface GroupAssignmentRule {
    id: string;
    name: string;
    description?: string;
    group_id: string;
    rule_type: 'score_based' | 'form_completion' | 'time_based';
    rule_config: {
        forms?: Array<{
            form_id: string;
            weight: number;
            threshold?: number;
        }>;
        min_score?: number;
        max_score?: number;
        operator?: 'gte' | 'lte' | 'eq' | 'between';
    };
    is_active: boolean;
    created_at: string;
    updated_at: string;
    group?: PatientGroup;
}

export interface PatientGroupAssignment {
    id: string;
    patient_id: string;
    old_group_id?: string;
    new_group_id?: string;
    assignment_reason?: string;
    assigned_by_rule_id?: string;
    submission_id?: string;
    created_at: string;
    old_group?: PatientGroup;
    new_group?: PatientGroup;
}

export interface PatientGroupMembership {
    id: string;
    patient_id: string;
    group_id: string;
    assigned_by_rule_id?: string;
    assignment_reason?: string;
    submission_id?: string;
    created_at: string;
    group?: PatientGroup;
}

/**
 * Get all patient groups
 */
export async function getPatientGroups(): Promise<PatientGroup[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('patient_groups')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch patient groups: ${error.message}`);
    }

    return data || [];
}

/**
 * Create a new patient group
 */
export async function createPatientGroup(
    group: Omit<PatientGroup, 'id' | 'created_at' | 'updated_at'>
): Promise<PatientGroup> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('patient_groups')
        .insert(group)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create patient group: ${error.message}`);
    }

    return data;
}

/**
 * Update a patient group
 */
export async function updatePatientGroup(
    id: string,
    updates: Partial<Omit<PatientGroup, 'id' | 'created_at' | 'updated_at'>>
): Promise<PatientGroup> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('patient_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update patient group: ${error.message}`);
    }

    return data;
}

/**
 * Delete a patient group
 */
export async function deletePatientGroup(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('patient_groups')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(`Failed to delete patient group: ${error.message}`);
    }
}

/**
 * Get all group assignment rules
 */
export async function getGroupAssignmentRules(): Promise<GroupAssignmentRule[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('group_assignment_rules')
        .select(`
      *,
      group:patient_groups(*)
    `)
        .order('name', { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch assignment rules: ${error.message}`);
    }

    return data || [];
}

/**
 * Create a new group assignment rule
 */
export async function createGroupAssignmentRule(
    rule: Omit<GroupAssignmentRule, 'id' | 'created_at' | 'updated_at' | 'group'>
): Promise<GroupAssignmentRule> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('group_assignment_rules')
        .insert(rule)
        .select(`
      *,
      group:patient_groups(*)
    `)
        .single();

    if (error) {
        throw new Error(`Failed to create assignment rule: ${error.message}`);
    }

    return data;
}

/**
 * Update a group assignment rule
 */
export async function updateGroupAssignmentRule(
    id: string,
    updates: Partial<Omit<GroupAssignmentRule, 'id' | 'created_at' | 'updated_at' | 'group'>>
): Promise<GroupAssignmentRule> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('group_assignment_rules')
        .update(updates)
        .eq('id', id)
        .select(`
      *,
      group:patient_groups(*)
    `)
        .single();

    if (error) {
        throw new Error(`Failed to update assignment rule: ${error.message}`);
    }

    return data;
}

/**
 * Delete a group assignment rule
 */
export async function deleteGroupAssignmentRule(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('group_assignment_rules')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(`Failed to delete assignment rule: ${error.message}`);
    }
}

/**
 * Get patient group assignment history
 */
export async function getPatientGroupAssignments(
    patientId?: string,
    limit: number = 50
): Promise<PatientGroupAssignment[]> {
    const supabase = createClient();

    let query = supabase
        .from('patient_group_assignments')
        .select(`
      *,
      old_group:patient_groups!old_group_id(*),
      new_group:patient_groups!new_group_id(*)
    `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (patientId) {
        query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to fetch group assignments: ${error.message}`);
    }

    return data || [];
}

/**
 * Manually trigger group assignment for a specific patient
 */
export async function manuallyAssignPatientGroup(patientId: string): Promise<any> {
    const supabase = createClient();

    // Use the new multi-group assignment function
    const { data, error } = await supabase.rpc('assign_patient_to_multiple_groups', {
        patient_id_param: patientId
    });

    if (error) {
        throw new Error(`Failed to trigger multi-group assignment: ${error.message}`);
    }

    return data;
}

/**
 * Remove a patient from a specific group
 */
export async function removePatientFromGroup(patientId: string, groupId: string): Promise<any> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('remove_patient_from_group', {
        patient_id_param: patientId,
        group_id_param: groupId
    });

    if (error) {
        throw new Error(`Failed to remove patient from group: ${error.message}`);
    }

    return data;
}

/**
 * Get patient group memberships
 */
export async function getPatientGroupMemberships(
    patientId?: string,
    limit: number = 50
): Promise<PatientGroupMembership[]> {
    const supabase = createClient();

    let query = supabase
        .from('patient_group_memberships')
        .select(`
      *,
      group:patient_groups(*)
    `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (patientId) {
        query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to fetch group memberships: ${error.message}`);
    }

    return data || [];
}

/**
 * Recalculate all patient group assignments
 */
export async function recalculateAllPatientGroups(): Promise<any> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('recalculate_all_patient_groups');

    if (error) {
        throw new Error(`Failed to recalculate assignments: ${error.message}`);
    }

    return data;
}

/**
 * Get available forms for assignment rules
 */
export async function getAvailableForms(): Promise<Array<{ form_id: string, title: string }>> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('forms')
        .select('form_id, title')
        .eq('is_active', true)
        .order('title');

    if (error) {
        throw new Error(`Failed to fetch forms: ${error.message}`);
    }

    return data || [];
}

/**
 * Get patients with their current groups (multiple memberships)
 */
export async function getPatientsWithGroups(): Promise<Array<{
    id: string;
    first_name: string;
    last_name: string;
    groups: PatientGroup[];
}>> {
    const supabase = createClient();

    // First get all patients
    const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .order('first_name');

    if (patientsError) {
        throw new Error(`Failed to fetch patients: ${patientsError.message}`);
    }

    // Then get all memberships with group details
    const { data: memberships, error: membershipsError } = await supabase
        .from('patient_group_memberships')
        .select(`
      patient_id,
      group:patient_groups(*)
    `);

    if (membershipsError) {
        throw new Error(`Failed to fetch memberships: ${membershipsError.message}`);
    }

    // Combine the data
    const patientsWithGroups = (patients || []).map(patient => {
        const patientMemberships = (memberships || []).filter(m => m.patient_id === patient.id);
        const groups = patientMemberships
            .map(m => Array.isArray(m.group) ? m.group[0] : m.group)
            .filter(g => g); // Remove null/undefined groups

        return {
            ...patient,
            groups: groups
        };
    });

    return patientsWithGroups;
}
