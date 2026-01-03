import { ActivityLogsTableClient } from './ActivityLogsTableClient';
import { getActivityLogs } from '@/app/service/activity-log';

export async function ActivityLogsTable() {
  const initialLogs = await getActivityLogs({ limit: 500 });

  return <ActivityLogsTableClient initialLogs={initialLogs} />;
}
