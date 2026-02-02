import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PatientGroup {
    id: string;
    name: string;
    description?: string;
    color?: string;
    created_at: string;
    updated_at: string;
}

export interface GroupEvent {
    id: string;
    group_id: string;
    title: string;
    description?: string;
    location?: string;
    event_datetime: string;
    is_active: boolean;
    is_recurring: boolean;
    recurrence_pattern?: string; // 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'
    recurrence_end_date?: string;
    created_at: string;
    updated_at: string;
    group?: PatientGroup;
    isRecurringInstance?: boolean; // Flag for generated recurring instances
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
            threshold: number;
            operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq';
        }>;
        logic_operator?: 'AND' | 'OR';
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
    date_of_birth: string | null;
    created_at: string;
    groups: PatientGroup[];
}>> {
    const supabase = createClient();

    // First get all patients (excluding soft-deleted)
    const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, date_of_birth, created_at')
        .is('deleted_at', null)
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
        
        // Sort groups alphabetically by name
        const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

        return {
            ...patient,
            groups: sortedGroups
        };
    });

    return patientsWithGroups;
}

export async function getPatientGroupsForPatient(
    patientId: string,
    supabaseClient?: SupabaseClient
): Promise<PatientGroup[]> {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
        .from('patient_group_memberships')
        .select(`
            group_id,
            patient_groups (
                id,
                name,
                description,
                color,
                created_at,
                updated_at
            )
        `)
        .eq('patient_id', patientId);

    if (error) {
        console.error('Error getting patient groups for patient:', error);
        return [];
    }

    // Extract the group objects from the join
    return data?.map((item: any) => item.patient_groups).filter(Boolean) || [];
}

// Group Events CRUD Functions
export async function createGroupEvent(groupEvent: Omit<GroupEvent, 'id' | 'created_at' | 'updated_at'>): Promise<GroupEvent | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
        .from('group_events')
        .insert({
            group_id: groupEvent.group_id,
            title: groupEvent.title,
            description: groupEvent.description || '',
            location: groupEvent.location || null,
            event_datetime: groupEvent.event_datetime,
            is_active: groupEvent.is_active,
            is_recurring: groupEvent.is_recurring || false,
            recurrence_pattern: groupEvent.recurrence_pattern,
            recurrence_end_date: groupEvent.recurrence_end_date
        })
        .select('*')
        .single();
    
    if (error) {
        console.error('Error creating group event:', error);
        return null;
    }
    
    return data;
}

export async function getGroupEvents(groupId?: string): Promise<GroupEvent[]> {
    const supabase = createClient();
    
    let query = supabase
        .from('group_events')
        .select('*, group:patient_groups(*)');
    
    if (groupId) {
        query = query.eq('group_id', groupId);
    }
    
    const { data, error } = await query.order('event_datetime', { ascending: true });
    
    if (error) {
        console.error('Error fetching group events:', error);
        return [];
    }
    
    return data || [];
}

export async function getUpcomingGroupEvents(groupIds?: string[], limit: number = 20, supabaseClient?: SupabaseClient): Promise<GroupEvent[]> {
    const supabase = supabaseClient || createClient();
    const now = new Date().toISOString();
    
    // First query: get upcoming non-recurring events and upcoming recurring events
    let upcomingQuery = supabase
        .from('group_events')
        .select('*, group:patient_groups(*)')
        .gt('event_datetime', now)
        .eq('is_active', true);
    
    if (groupIds && groupIds.length > 0) {
        upcomingQuery = upcomingQuery.in('group_id', groupIds);
    }
    
    // Second query: get past recurring events that haven't ended yet
    // These are recurring events whose original date is in the past but still generate future instances
    let pastRecurringQuery = supabase
        .from('group_events')
        .select('*, group:patient_groups(*)')
        .lt('event_datetime', now)
        .eq('is_active', true)
        .eq('is_recurring', true)
        .or(`recurrence_end_date.is.null,recurrence_end_date.gt.${now}`); // Include if no end date or end date is in future
    
    if (groupIds && groupIds.length > 0) {
        pastRecurringQuery = pastRecurringQuery.in('group_id', groupIds);
    }
    
    const [upcomingResult, pastRecurringResult] = await Promise.all([
        upcomingQuery,
        pastRecurringQuery
    ]);
    
    console.log('[getUpcomingGroupEvents] Filtered query results:', {
        upcomingCount: upcomingResult.data?.length || 0,
        upcomingError: upcomingResult.error,
        pastRecurringCount: pastRecurringResult.data?.length || 0,
        pastRecurringError: pastRecurringResult.error
    });
    
    if (upcomingResult.error) {
        console.error('Error fetching upcoming group events:', upcomingResult.error);
        return [];
    }
    
    if (pastRecurringResult.error) {
        console.error('Error fetching past recurring group events:', pastRecurringResult.error);
        // Continue with just upcoming events if this fails
    }
    
    // Combine both results, removing duplicates
    const allFetchedEvents = [...(upcomingResult.data || [])];
    const pastRecurringEvents = pastRecurringResult.data || [];
    
    // Add past recurring events if they're not already in the upcoming list
    for (const pastEvent of pastRecurringEvents) {
        if (!allFetchedEvents.find(e => e.id === pastEvent.id)) {
            allFetchedEvents.push(pastEvent);
        }
    }
    
    const expandedEvents: GroupEvent[] = [];
    const now_date = new Date();
    
    // Get the date 60 days from now for recurring event expansion limit
    const maxExpandDate = new Date();
    maxExpandDate.setDate(maxExpandDate.getDate() + 60);
    
    // Process all events
    for (const event of allFetchedEvents) {
        if (event.is_recurring && event.recurrence_pattern) {
            const eventDate = new Date(event.event_datetime);
            
            // For past recurring events, generate instances starting from now
            // For future recurring events, include the original event and generate subsequent instances
            if (eventDate > now_date) {
                // Future recurring event - add the original event
                expandedEvents.push(event);
                
                // Generate future instances starting from the day after the original event
                const expandedInstances = generateRecurringEventInstances(
                    event,
                    eventDate,
                    maxExpandDate,
                    event.recurrence_end_date ? new Date(event.recurrence_end_date) : undefined,
                    false,
                    false // Not the first instance
                );
                expandedEvents.push(...expandedInstances);
            } else {
                // Past recurring event - generate instances starting from now
                // The first generated instance should NOT be marked as isRecurringInstance
                // so it shows up in the UI as the "main" occurrence
                const expandedInstances = generateRecurringEventInstances(
                    event,
                    now_date, // Start from today instead of original date
                    maxExpandDate,
                    event.recurrence_end_date ? new Date(event.recurrence_end_date) : undefined,
                    true, // Flag to indicate we're generating from "now" not from original date
                    true // Mark first instance as primary (not recurring instance)
                );
                expandedEvents.push(...expandedInstances);
            }
        } else {
            // For non-recurring events, just add them if they're in the future
            if (new Date(event.event_datetime) > now_date) {
                expandedEvents.push(event);
            }
        }
    }
    
    // Sort by date, filter to only future events, and limit
    return expandedEvents
        .filter(event => new Date(event.event_datetime) > now_date)
        .sort((a, b) => new Date(a.event_datetime).getTime() - new Date(b.event_datetime).getTime())
        .slice(0, limit);
}

/**
 * Helper function to generate recurring event instances
 */
function generateRecurringEventInstances(
    baseEvent: GroupEvent,
    startDate: Date,
    maxDate: Date,
    endDate?: Date,
    startFromNow: boolean = false,
    markFirstAsPrimary: boolean = false
): GroupEvent[] {
    const instances: GroupEvent[] = [];
    const actualEndDate = endDate && endDate < maxDate ? endDate : maxDate;
    
    // Get the original event date for calculating recurrence patterns
    const originalEventDate = new Date(baseEvent.event_datetime);
    
    let currentDate = new Date(startDate);
    let isFirstInstance = true; // Track if this is the first generated instance
    
    // If startFromNow is true, we're generating from today for a past recurring event
    // We need to find the next occurrence based on the original event's pattern
    if (startFromNow) {
        // Start from today, but we need to align with the recurrence pattern from the original date
        currentDate = new Date();
        currentDate.setHours(originalEventDate.getHours(), originalEventDate.getMinutes(), originalEventDate.getSeconds(), 0);
    } else {
        // For future events, start from the next day after the original event
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    while (currentDate <= actualEndDate) {
        let shouldAddInstance = false;
        
        switch (baseEvent.recurrence_pattern) {
            case 'daily':
                shouldAddInstance = true;
                break;
                
            case 'weekly':
                shouldAddInstance = currentDate.getDay() === originalEventDate.getDay();
                break;
                
            case 'biweekly':
                // Calculate the number of weeks between the original event date and current date
                const diffTime = Math.abs(currentDate.getTime() - originalEventDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffWeeks = Math.floor(diffDays / 7);
                
                // Check if it's the same day of the week and falls on an even week count
                shouldAddInstance = 
                    currentDate.getDay() === originalEventDate.getDay() && 
                    diffWeeks % 2 === 0;
                break;
                
            case 'monthly':
                // For monthly, keep the same day of month
                // Handle edge cases like Feb 30 -> last day of Feb
                const targetDay = originalEventDate.getDate();
                const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                shouldAddInstance = currentDate.getDate() === Math.min(targetDay, lastDayOfMonth);
                break;
                
            case 'yearly':
                shouldAddInstance = 
                    currentDate.getDate() === originalEventDate.getDate() && 
                    currentDate.getMonth() === originalEventDate.getMonth();
                break;
        }
        
        if (shouldAddInstance && currentDate > new Date()) {
            // Create a new instance with the same properties but different date
            const eventTimeString = originalEventDate.toTimeString().split(' ')[0];
            const newDatetime = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
                parseInt(eventTimeString.split(':')[0]),
                parseInt(eventTimeString.split(':')[1]),
                parseInt(eventTimeString.split(':')[2])
            ).toISOString();
            
            // If markFirstAsPrimary is true, the first instance should NOT have isRecurringInstance flag
            // This allows it to show up in the UI as the main event
            const shouldMarkAsInstance = !markFirstAsPrimary || !isFirstInstance;
            
            instances.push({
                ...baseEvent,
                id: `${baseEvent.id}_recurring_${currentDate.toISOString()}`,
                event_datetime: newDatetime,
                ...(shouldMarkAsInstance && { isRecurringInstance: true }) // Only add flag if not the first primary instance
            } as GroupEvent);
            
            isFirstInstance = false; // After first instance, all others are regular instances
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return instances;
}

export async function getGroupEvent(eventId: string): Promise<GroupEvent | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
        .from('group_events')
        .select('*, group:patient_groups(*)')
        .eq('id', eventId)
        .single();
    
    if (error) {
        console.error('Error fetching group event:', error);
        return null;
    }
    
    return data;
}

export async function updateGroupEvent(eventId: string, updates: Partial<Omit<GroupEvent, 'id' | 'created_at' | 'updated_at'>>): Promise<GroupEvent | null> {
    const supabase = createClient();
    
    // Build update object with only defined values
    const updateData: Record<string, any> = {};
    
    if (updates.group_id !== undefined) updateData.group_id = updates.group_id;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.event_datetime !== undefined) updateData.event_datetime = updates.event_datetime;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.is_recurring !== undefined) updateData.is_recurring = updates.is_recurring;
    if (updates.recurrence_pattern !== undefined) updateData.recurrence_pattern = updates.recurrence_pattern;
    if (updates.recurrence_end_date !== undefined) updateData.recurrence_end_date = updates.recurrence_end_date;
    
    console.log('[updateGroupEvent] Updating event:', { eventId, updateData });
    
    const { data, error } = await supabase
        .from('group_events')
        .update(updateData)
        .eq('id', eventId)
        .select('*')
        .single();
    
    if (error) {
        console.error('[updateGroupEvent] Error:', {
            error,
            errorString: JSON.stringify(error),
            code: error?.code,
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            eventId,
            updateData
        });
        throw new Error(`Failed to update group event: ${error?.message || JSON.stringify(error) || 'Unknown error'}`);
    }
    
    console.log('[updateGroupEvent] Success:', data);
    return data;
}

export async function deleteGroupEvent(eventId: string): Promise<boolean> {
    const supabase = createClient();
    
    const { error } = await supabase
        .from('group_events')
        .delete()
        .eq('id', eventId);
    
    if (error) {
        console.error('Error deleting group event:', {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            eventId
        });
        throw new Error(`Failed to delete group event: ${error.message || 'Unknown error'}`);
    }
    
    return true;
}
