'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2 } from 'lucide-react';
import { GroupAssignmentRule } from '@/app/service/group-assignment';

interface RuleCardProps {
  rule: GroupAssignmentRule;
  onEdit: (rule: GroupAssignmentRule) => void;
  onDelete: (ruleId: string) => void;
  isLoading: boolean;
}

export function RuleCard({ rule, onEdit, onDelete, isLoading }: RuleCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{rule.name}</h3>
              <Badge variant={rule.is_active ? "default" : "secondary"}>
                {rule.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
              </Badge>
            </div>

            {rule.description && (
              <p className="text-gray-600 mb-3">{rule.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: rule.group?.color }}
                />
                <span>กลุ่ม: {rule.group?.name}</span>
              </div>
              <div>
                แบบแบบสอบถาม: {rule.rule_config.forms?.length || 0} แบบแบบสอบถาม
              </div>
              <div>
                เงื่อนไข: {rule.rule_config.operator === 'gte' ? '≥' : rule.rule_config.operator === 'lte' ? '≤' : 'ระหว่าง'} {rule.rule_config.min_score}
                {rule.rule_config.operator === 'between' && ` - ${rule.rule_config.max_score}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(rule)}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการลบเงื่อนไข</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณแน่ใจหรือว่าต้องการลบเงื่อนไข "{rule.name}"
                    การดำเนินการนี้ไม่สามารถยกเลิกได้
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(rule.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    ลบ
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
