'use server';

import { logAdminExport } from '@/app/service/activity-log';

export async function logExportAction(
  export_type: string = 'full_export',
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await logAdminExport(export_type, metadata);
    return { success: !!result };
  } catch (error) {
    console.error('Error logging export:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
