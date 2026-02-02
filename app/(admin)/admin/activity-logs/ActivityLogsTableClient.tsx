'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toThaiDateTime, toThaiDate } from '@/lib/timezone';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ActivityLog } from '@/app/service/activity-log';
import { 
  FileText, 
  Users, 
  UserPlus, 
  UserMinus, 
  FolderPlus, 
  FolderEdit,
  UserCheck,
  Calendar,
  Target,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  FileDown,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

const ITEMS_PER_PAGE = 20;

interface ActivityLogsTableClientProps {
  initialLogs: ActivityLog[];
}

export function ActivityLogsTableClient({ initialLogs }: ActivityLogsTableClientProps) {
  const [logs] = useState<ActivityLog[]>(initialLogs);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>(initialLogs);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filters
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    applyFilters();
  }, [activityTypeFilter, entityTypeFilter, searchQuery]);

  const applyFilters = () => {
    let filtered = [...logs];

    if (activityTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.activity_type === activityTypeFilter);
    }

    if (entityTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.entity_type === entityTypeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(query) ||
        log.entity_id.toLowerCase().includes(query) ||
        log.performed_by_name?.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActivityTypeFilter('all');
    setEntityTypeFilter('all');
    setSearchQuery('');
  };

  const getActivityIcon = (activityType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      survey_submitted: <FileText className="h-4 w-4" />,
      survey_created: <FolderPlus className="h-4 w-4" />,
      survey_updated: <FolderEdit className="h-4 w-4" />,
      survey_deleted: <FolderEdit className="h-4 w-4" />,
      survey_activated: <ToggleRight className="h-4 w-4" />,
      survey_deactivated: <ToggleLeft className="h-4 w-4" />,
      patient_created: <UserPlus className="h-4 w-4" />,
      patient_updated: <Users className="h-4 w-4" />,
      patient_deleted: <UserMinus className="h-4 w-4" />,
      patient_checkin: <UserCheck className="h-4 w-4" />,
      event_created: <Calendar className="h-4 w-4" />,
      event_updated: <Calendar className="h-4 w-4" />,
      event_deleted: <Calendar className="h-4 w-4" />,
      group_created: <Target className="h-4 w-4" />,
      group_updated: <Target className="h-4 w-4" />,
      group_deleted: <Target className="h-4 w-4" />,
      admin_export_data: <FileDown className="h-4 w-4" />,
      staff_created: <UserPlus className="h-4 w-4" />,
      staff_updated: <Users className="h-4 w-4" />,
      staff_password_reset: <Users className="h-4 w-4" />,
      staff_deleted: <UserMinus className="h-4 w-4" />,
    };
    return iconMap[activityType] || <FileText className="h-4 w-4" />;
  };

  const getActivityBadgeColor = (activityType: string): "default" | "secondary" | "destructive" | "outline" => {
    if (activityType.includes('created')) return 'default';
    if (activityType.includes('updated')) return 'secondary';
    if (activityType.includes('deleted')) return 'destructive';
    if (activityType.includes('submitted')) return 'default';
    return 'outline';
  };

  const activityTypeLabels: Record<string, string> = {
    survey_submitted: 'ส่งแบบสอบถาม',
    survey_created: 'สร้างแบบสอบถาม',
    survey_updated: 'แก้ไขแบบสอบถาม',
    survey_deleted: 'ลบแบบสอบถาม',
    survey_activated: 'เปิดใช้งานแบบสอบถาม',
    survey_deactivated: 'ปิดใช้งานแบบสอบถาม',
    patient_created: 'สร้างผู้ใช้บริการ',
    patient_updated: 'แก้ไขผู้ใช้บริการ',
    patient_deleted: 'ลบผู้ใช้บริการ',
    patient_checkin: 'เช็คอิน',
    group_created: 'สร้างกลุ่ม',
    group_updated: 'แก้ไขกลุ่ม',
    group_deleted: 'ลบกลุ่ม',
    event_created: 'สร้างกิจกรรม',
    event_updated: 'แก้ไขกิจกรรม',
    event_deleted: 'ลบกิจกรรม',
    admin_export_data: 'ส่งออกข้อมูล Excel',
    staff_created: 'สร้างพนักงาน',
    staff_updated: 'แก้ไขข้อมูลพนักงาน',
    staff_password_reset: 'รีเซ็ตรหัสผ่านพนักงาน',
    staff_deleted: 'ลบพนักงาน',
  };

  const entityTypeLabels: Record<string, string> = {
    submission: 'แบบสอบถาม',
    survey: 'แบบสอบถาม',
    patient: 'ผู้ใช้บริการ',
    patient_group: 'กลุ่ม',
    checkin: 'เช็คอิน',
    group_event: 'กิจกรรม',
    admin_action: 'การดำเนินการของแอดมิน',
    staff: 'พนักงาน',
  };

  // Get unique activity and entity types for filters
  const uniqueActivityTypes = Array.from(new Set(logs.map(log => log.activity_type)));
  const uniqueEntityTypes = Array.from(new Set(logs.map(log => log.entity_type)));

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const hasActiveFilters = activityTypeFilter !== 'all' || entityTypeFilter !== 'all' || searchQuery;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ประวัติการใช้งานระบบทั้งหมด</CardTitle>
          <div className="text-sm text-muted-foreground">
            แสดง {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} จาก {filteredLogs.length} รายการ
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <Label htmlFor="activity-type-filter" className="text-xs">ประเภทกิจกรรม</Label>
            <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
              <SelectTrigger id="activity-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {uniqueActivityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {activityTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="entity-type-filter" className="text-xs">ประเภทข้อมูล</Label>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger id="entity-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {uniqueEntityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {entityTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="search" className="text-xs">ค้นหา</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="ค้นหาคำอธิบาย, ID, หรือชื่อผู้ใช้..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              ล้างตัวกรอง
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {currentLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {hasActiveFilters ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข' : 'ยังไม่มีประวัติการใช้งานระบบ'}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>กิจกรรม</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead>ผู้ดำเนินการ</TableHead>
                    <TableHead className="text-right">เวลา</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedLog(log);
                        setIsDialogOpen(true);
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getActivityIcon(log.activity_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={getActivityBadgeColor(log.activity_type)} className="w-fit">
                            {activityTypeLabels[log.activity_type] || log.activity_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {entityTypeLabels[log.entity_type] || log.entity_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.description}</span>
                          <span className="text-xs text-muted-foreground">
                            ID: {log.entity_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{log.performed_by_name || 'ระบบ'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(log.created_at), {
                              addSuffix: true,
                              locale: th,
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {toThaiDateTime(log.created_at, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  หน้า {currentPage} จาก {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    ก่อนหน้า
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    ถัดไป
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getActivityIcon(selectedLog.activity_type)}
              รายละเอียดกิจกรรม
            </DialogTitle>
            <DialogDescription>
              {selectedLog && activityTypeLabels[selectedLog.activity_type]}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">คำอธิบาย</Label>
                <p className="text-sm font-medium">{selectedLog.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ประเภทกิจกรรม</Label>
                  <p className="text-sm">
                    {activityTypeLabels[selectedLog.activity_type] || selectedLog.activity_type}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ประเภทข้อมูล</Label>
                  <p className="text-sm">
                    {entityTypeLabels[selectedLog.entity_type] || selectedLog.entity_type}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">รหัสข้อมูล (Entity ID)</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{selectedLog.entity_id}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">ผู้ดำเนินการ</Label>
                <p className="text-sm">{selectedLog.performed_by_name || 'ระบบ'}</p>
                {selectedLog.performed_by && (
                  <p className="text-xs text-muted-foreground font-mono">
                    User ID: {selectedLog.performed_by}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">เวลาที่เกิดเหตุการณ์</Label>
                  <p className="text-sm">
                    {toThaiDateTime(selectedLog.created_at, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">หมดอายุ</Label>
                  <p className="text-sm">
                    {toThaiDate(selectedLog.expires_at)}
                  </p>
                </div>
              </div>

              {selectedLog.ip_address && (
                <div>
                  <Label className="text-xs text-muted-foreground">IP Address</Label>
                  <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">ข้อมูลเพิ่มเติม (Metadata)</Label>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
