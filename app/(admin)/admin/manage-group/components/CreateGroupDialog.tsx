'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    name: string;
    description: string;
    color: string;
  };
  onFormChange: (form: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function CreateGroupDialog({
  isOpen,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isLoading
}: CreateGroupDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มกลุ่มใหม่
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มกลุ่มผู้ใช้บริการใหม่</DialogTitle>
          <DialogDescription>
            สร้างกลุ่มใหม่สำหรับจัดประเภทผู้ใช้บริการ
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="group-name">ชื่อกลุ่ม *</Label>
            <Input
              id="group-name"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="เช่น กลุ่มพิเศษ"
            />
          </div>

          <div>
            <Label htmlFor="group-description">รายละเอียด</Label>
            <Textarea
              id="group-description"
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              placeholder="อธิบายลักษณะของกลุ่ม"
            />
          </div>

          <div>
            <Label htmlFor="group-color">สีกลุ่ม</Label>
            <div className="flex items-center gap-3">
              <Input
                id="group-color"
                type="color"
                value={form.color}
                onChange={(e) => onFormChange({ ...form, color: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={form.color}
                onChange={(e) => onFormChange({ ...form, color: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'กำลังสร้าง...' : 'สร้างกลุ่ม'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
