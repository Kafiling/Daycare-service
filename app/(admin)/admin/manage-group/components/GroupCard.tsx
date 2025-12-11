'use client';

import { Button } from '@/components/ui/button';
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
import { Edit, Trash2, Users } from 'lucide-react';
import { PatientGroup } from '@/app/service/group-assignment';

interface GroupCardProps {
  group: PatientGroup;
  onEdit: (group: PatientGroup) => void;
  onDelete: (groupId: string) => void;
  isLoading: boolean;
}

export function GroupCard({ group, onEdit, onDelete, isLoading }: GroupCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: group.color }}
            >
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{group.name}</h3>
              {group.description && (
                <p className="text-gray-600 text-sm">{group.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span>สี: {group.color}</span>
                <span>สร้างเมื่อ: {new Date(group.created_at).toLocaleDateString('th-TH')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(group)}
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
                  <AlertDialogTitle>ยืนยันการลบกลุ่ม</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณแน่ใจหรือว่าต้องการลบกลุ่ม "{group.name}"
                    การดำเนินการนี้จะย้ายผู้ใช้บริการในกลุ่มนี้ออกและไม่สามารถยกเลิกได้
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(group.id)}
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
