import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getActivityStatistics } from '@/app/service/activity-log';
import { Activity, TrendingUp, Users } from 'lucide-react';

export async function ActivityLogStats() {
  const stats = await getActivityStatistics(7);

  const topActivityType = Object.entries(stats.by_type)
    .sort(([, a], [, b]) => b - a)[0];
  
  const topEntityType = Object.entries(stats.by_entity)
    .sort(([, a], [, b]) => b - a)[0];

  const activityTypeLabels: Record<string, string> = {
    survey_submitted: 'ส่งแบบสอบถาม',
    patient_created: 'สร้างผู้ใช้บริการ',
    patient_updated: 'แก้ไขผู้ใช้บริการ',
    patient_deleted: 'ลบผู้ใช้บริการ',
    form_created: 'สร้างแบบสอบถาม',
    form_updated: 'แก้ไขแบบสอบถาม',
    form_deleted: 'ลบแบบสอบถาม',
    group_created: 'สร้างกลุ่ม',
    group_updated: 'แก้ไขกลุ่ม',
    patient_checkin: 'เช็คอิน',
    event_created: 'สร้างกิจกรรม',
  };

  const entityTypeLabels: Record<string, string> = {
    submission: 'แบบสอบถาม',
    form: 'แบบสอบถาม',
    patient: 'ผู้ใช้บริการ',
    patient_group: 'กลุ่ม',
    checkin: 'เช็คอิน',
    group_event: 'กิจกรรม',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            กิจกรรมทั้งหมด (7 วันล่าสุด)
          </CardTitle>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_activities.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            บันทึกกิจกรรมในระบบ
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            กิจกรรมที่พบบ่อยที่สุด
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {topActivityType ? activityTypeLabels[topActivityType[0]] || topActivityType[0] : 'ไม่มีข้อมูล'} ({topActivityType ? topActivityType[1].toLocaleString() : '0'})
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            ประเภทกิจกรรมที่พบบ่อยที่สุด
          </CardTitle>
          <Users className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {topEntityType ? entityTypeLabels[topEntityType[0]] || topEntityType[0] : 'ไม่มีข้อมูล'}  ({topEntityType ? topEntityType[1].toLocaleString() : '0'})
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
