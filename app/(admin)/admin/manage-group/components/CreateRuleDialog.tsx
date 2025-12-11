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
    min_score?: number;
    max_score?: number;
    operator: 'gte' | 'lte' | 'eq' | 'between';
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
              <Label>แบบแบบสอบถามและน้ำหนัก *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddForm}
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มแบบแบบสอบถาม
              </Button>
            </div>

            {form.forms.map((formItem, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Select
                    value={formItem.form_id}
                    onValueChange={(value) => onUpdateFormConfig(index, 'form_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกแบบแบบสอบถาม" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableForms.map((availableForm) => (
                        <SelectItem key={availableForm.form_id} value={availableForm.form_id}>
                          {availableForm.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formItem.weight}
                    onChange={(e) => onUpdateFormConfig(index, 'weight', parseFloat(e.target.value) || 1)}
                    placeholder="น้ำหนัก"
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="create-operator">เงื่อนไข</Label>
              <Select
                value={form.operator}
                onValueChange={(value: any) => onFormChange({ ...form, operator: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gte">มากกว่าเท่ากับ (≥)</SelectItem>
                  <SelectItem value="lte">น้อยกว่าเท่ากับ (≤)</SelectItem>
                  <SelectItem value="between">ระหว่าง</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="create-min-score">คะแนน</Label>
              <Input
                id="create-min-score"
                type="number"
                step="0.1"
                value={form.min_score || ''}
                onChange={(e) => onFormChange({ ...form, min_score: parseFloat(e.target.value) || undefined })}
                placeholder="0"
              />
            </div>
            {form.operator === 'between' && (
              <div>
                <Label htmlFor="create-max-score">คะแนน</Label>
                <Input
                  id="create-max-score"
                  type="number"
                  step="0.1"
                  value={form.max_score || ''}
                  onChange={(e) => onFormChange({ ...form, max_score: parseFloat(e.target.value) || undefined })}
                  placeholder="100"
                />
              </div>
            )}
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
            {isLoading ? 'กำลังสร้าง...' : 'สร้างเงื่อนไข'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
