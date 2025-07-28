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
    priority: number;
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
        .order('priority', { ascending: false });

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

    // Try the HTTP-based function first
    const { data, error } = await supabase.rpc('manually_assign_patient_group', {
        patient_id_param: patientId
    });

    // If the HTTP-based function fails, try the simplified version
    if (error) {
        console.warn('HTTP-based assignment failed, trying simplified version:', error.message);

        const { data: fallbackData, error: fallbackError } = await supabase.rpc('manually_assign_patient_group_simple', {
            patient_id_param: patientId
        });

        if (fallbackError) {
            throw new Error(`Failed to trigger manual assignment: ${fallbackError.message}`);
        }

        return fallbackData;
    }

    return data;
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
 * Get patients with their current groups
 */
export async function getPatientsWithGroups(): Promise<Array<{
    id: string;
    first_name: string;
    last_name: string;
    group_id?: string;
    group?: PatientGroup;
}>> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('patients')
        .select(`
      id,
      first_name,
      last_name,
      group_id,
      group:patient_groups(*)
    `)
        .order('first_name');

    if (error) {
        throw new Error(`Failed to fetch patients with groups: ${error.message}`);
    }

    return data || [];
}
