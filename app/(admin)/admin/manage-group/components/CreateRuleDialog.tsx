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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { PatientGroup } from '@/app/service/group-assignment';
import { FormConfig } from '../GroupAssignmentManagementClient';

interface CreateRuleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    name: string;
    description: string;
    group_id: string;
    forms: FormConfig[];
    logic_operator: 'AND' | 'OR';
  };
  groups: PatientGroup[];
  availableForms: Array<{ form_id: string; title: string }>;
  onFormChange: (form: any) => void;
  onAddForm: () => void;
  onRemoveForm: (index: number) => void;
  onUpdateFormConfig: (index: number, field: keyof FormConfig, value: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function CreateRuleDialog({
  isOpen,
  onOpenChange,
  form,
  groups,
  availableForms,
  onFormChange,
  onAddForm,
  onRemoveForm,
  onUpdateFormConfig,
  onSubmit,
  isLoading
}: CreateRuleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มเงื่อนไขใหม่
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มเงื่อนไขการแบ่งกลุ่มใหม่</DialogTitle>
          <DialogDescription>
            กำหนดเงื่อนไขสำหรับเพิ่มผู้ใช้บริการเข้ากลุ่มอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="create-name">ชื่อเงื่อนไข *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="เช่น ผู้ใช้บริการเสี่ยงสูง"
            />
          </div>

          <div>
            <Label htmlFor="create-description">รายละเอียด</Label>
            <Textarea
              id="create-description"
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              placeholder="อธิบายเงื่อนไขการแบ่งกลุ่ม"
            />
          </div>

          <div>
            <Label htmlFor="create-group">กลุ่มเป้าหมาย *</Label>
            <Select
              value={form.group_id}
              onValueChange={(value) => onFormChange({ ...form, group_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกกลุ่ม" />
              </SelectTrigger>
              <SelectContent>
                {[...groups].sort((a, b) => a.name.localeCompare(b.name)).map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>แบบสอบถามและเงื่อนไข *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddForm}
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มแบบสอบถาม
              </Button>
            </div>

            {form.forms.map((formItem, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <Label className="text-xs">แบบสอบถาม</Label>
                  <Select
                    value={formItem.form_id}
                    onValueChange={(value) => onUpdateFormConfig(index, 'form_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกแบบสอบถาม" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableForms.map((availableForm) => (
                        <SelectItem key={availableForm.form_id} value={availableForm.form_id}>
                          <div className="whitespace-normal break-words text-left py-2 pr-2">
                            {availableForm.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">เงื่อนไข</Label>
                  <Select
                    value={formItem.operator}
                    onValueChange={(value: any) => onUpdateFormConfig(index, 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gte">≥</SelectItem>
                      <SelectItem value="gt">&gt;</SelectItem>
                      <SelectItem value="eq">=</SelectItem>
                      <SelectItem value="lt">&lt;</SelectItem>
                      <SelectItem value="lte">≤</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">คะแนน</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formItem.threshold}
                    onChange={(e) => onUpdateFormConfig(index, 'threshold', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="col-span-2">
                  {form.forms.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveForm(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {form.forms.length > 1 && (
            <div>
              <Label htmlFor="create-logic-operator">ตรรกะการรวมเงื่อนไข</Label>
              <Select
                value={form.logic_operator}
                onValueChange={(value: 'AND' | 'OR') => onFormChange({ ...form, logic_operator: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND (ต้องผ่านเงื่อนไขทั้งหมด)</SelectItem>
                  <SelectItem value="OR">OR (ผ่านเงื่อนไขใดเงื่อนไขหนึ่ง)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                AND: ผู้ใช้บริการต้องผ่านเงื่อนไขของแบบสอบถามทั้งหมด | OR: ผ่านแบบสอบถามใดแบบหนึ่งก็ได้
              </p>
            </div>
          )}
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
            {isLoading ? 'กำลังสร้าง...' : 'สร้างเงื่อนไข'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
