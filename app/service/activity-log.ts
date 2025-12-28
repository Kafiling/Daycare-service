import { createClient } from '@/utils/supabase/server';

export interface ActivityLog {
  id: string;
  activity_type: string;
  entity_type: string;
  entity_id: string;
  performed_by: string | null;
  performed_by_name: string | null;
  description: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
}

export interface ActivityLogFilters {
  activity_type?: string | string[];
  entity_type?: string | string[];
  entity_id?: string;
  performed_by?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get activity logs with optional filters
 */
export async function getActivityLogs(filters: ActivityLogFilters = {}): Promise<ActivityLog[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.activity_type) {
    if (Array.isArray(filters.activity_type)) {
      query = query.in('activity_type', filters.activity_type);
    } else {
      query = query.eq('activity_type', filters.activity_type);
    }
  }

  if (filters.entity_type) {
    if (Array.isArray(filters.entity_type)) {
      query = query.in('entity_type', filters.entity_type);
    } else {
      query = query.eq('entity_type', filters.entity_type);
    }
  }

  if (filters.entity_id) {
    query = query.eq('entity_id', filters.entity_id);
  }

  if (filters.performed_by) {
    query = query.eq('performed_by', filters.performed_by);
  }

  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date);
  }

  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date);
  }

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get activity logs for a specific entity
 */
export async function getEntityActivityLogs(
  entity_type: string,
  entity_id: string,
  limit: number = 50
): Promise<ActivityLog[]> {
  return getActivityLogs({
    entity_type,
    entity_id,
    limit
  });
}

/**
 * Get activity logs by activity type
 */
export async function getActivityLogsByType(
  activity_type: string | string[],
  limit: number = 100
): Promise<ActivityLog[]> {
  return getActivityLogs({
    activity_type,
    limit
  });
}

/**
 * Get recent activity logs
 */
export async function getRecentActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
  return getActivityLogs({ limit });
}

/**
 * Get activity logs for a specific user
 */
export async function getUserActivityLogs(
  user_id: string,
  limit: number = 50
): Promise<ActivityLog[]> {
  return getActivityLogs({
    performed_by: user_id,
    limit
  });
}

/**
 * Get activity statistics
 */
export async function getActivityStatistics(days: number = 7): Promise<{
  total_activities: number;
  by_type: Record<string, number>;
  by_entity: Record<string, number>;
}> {
  const supabase = await createClient();
  
  const start_date = new Date();
  start_date.setDate(start_date.getDate() - days);

  const { data, error } = await supabase
    .from('activity_logs')
    .select('activity_type, entity_type')
    .gte('created_at', start_date.toISOString());

  if (error) {
    console.error('Error fetching activity statistics:', error);
    throw error;
  }

  const stats = {
    total_activities: data?.length || 0,
    by_type: {} as Record<string, number>,
    by_entity: {} as Record<string, number>
  };

  data?.forEach((log) => {
    stats.by_type[log.activity_type] = (stats.by_type[log.activity_type] || 0) + 1;
    stats.by_entity[log.entity_type] = (stats.by_entity[log.entity_type] || 0) + 1;
  });

  return stats;
}

/**
 * Manually log an activity (for use in application code)
 */
export async function logActivity(
  activity_type: string,
  entity_type: string,
  entity_id: string,
  description: string,
  metadata: Record<string, any> = {},
  request?: Request
): Promise<string | null> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user found for activity logging');
    return null;
  }

  // Get user name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, username')
    .eq('id', user.id)
    .single();

  const performed_by_name = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username
    : null;

  // Extract IP and user agent from request if available
  const ip_address = request?.headers.get('x-forwarded-for')?.split(',')[0] || null;
  const user_agent = request?.headers.get('user-agent') || null;

  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      activity_type,
      entity_type,
      entity_id,
      performed_by: user.id,
      performed_by_name,
      description,
      metadata,
      ip_address,
      user_agent
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error logging activity:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Delete expired activity logs (should be called by a cron job)
 */
export async function deleteExpiredActivityLogs(): Promise<number> {
  const supabase = await createClient();
  
  const { error } = await supabase.rpc('delete_expired_activity_logs');

  if (error) {
    console.error('Error deleting expired activity logs:', error);
    throw error;
  }

  // Get count of remaining logs
  const { count } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact', head: true });

  return count || 0;
}

/**
 * Activity type constants for easy reference
 */
export const ACTIVITY_TYPES = {
  // Patient activities
  PATIENT_CREATED: 'patient_created',
  PATIENT_UPDATED: 'patient_updated',
  PATIENT_DELETED: 'patient_deleted',
  PATIENT_CHECKIN: 'patient_checkin',
  
  // Survey activities
  SURVEY_SUBMITTED: 'survey_submitted',
  SURVEY_CREATED: 'survey_created',
  SURVEY_UPDATED: 'survey_updated',
  SURVEY_DELETED: 'survey_deleted',
  SURVEY_ACTIVATED: 'survey_activated',
  SURVEY_DEACTIVATED: 'survey_deactivated',
  
  // Group activities
  GROUP_CREATED: 'group_created',
  GROUP_UPDATED: 'group_updated',
  GROUP_DELETED: 'group_deleted',
  GROUP_ASSIGNED: 'group_assigned',
  
  // Event activities
  EVENT_CREATED: 'event_created',
  EVENT_UPDATED: 'event_updated',
  EVENT_DELETED: 'event_deleted',
  
  // Admin activities
  ADMIN_EXPORT_DATA: 'admin_export_data',
} as const;

/**
 * Entity type constants
 */
export const ENTITY_TYPES = {
  PATIENT: 'patient',
  SUBMISSION: 'submission',
  SURVEY: 'survey',
  PATIENT_GROUP: 'patient_group',
  GROUP_EVENT: 'group_event',
  CHECKIN: 'checkin',
  ADMIN_ACTION: 'admin_action',
} as const;

/**
 * Log admin export activity
 */
export async function logAdminExport(
  export_type: string = 'full_export',
  metadata: Record<string, any> = {}
): Promise<string | null> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Error getting user for admin export log:', userError);
    return null;
  }

  // Call the database function
  const { data, error } = await supabase.rpc('log_admin_export', {
    p_performed_by: user.id,
    p_export_type: export_type,
    p_metadata: metadata
  });

  if (error) {
    console.error('Error logging admin export:', error);
    return null;
  }

  return data;
}
