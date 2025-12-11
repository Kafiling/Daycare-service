'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Users,
  Activity,
  RefreshCw,
  Target,
  Zap,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getPatientGroups,
  getGroupAssignmentRules,
  getAvailableForms,
  getPatientsWithGroups,
  getPatientGroupAssignments,
  createGroupAssignmentRule,
  updateGroupAssignmentRule,
  deleteGroupAssignmentRule,
  createPatientGroup,
  updatePatientGroup,
  deletePatientGroup,
  manuallyAssignPatientGroup,
  recalculateAllPatientGroups,
  removePatientFromGroup,
  GroupAssignmentRule,
  PatientGroup,
  PatientGroupAssignment
} from '@/app/service/group-assignment';
import { GroupEventsManagement } from '@/components/group/GroupEventsManagement';

export interface FormConfig {
  form_id: string;
  weight: number;
  threshold?: number;
}

interface CreateRuleForm {
  name: string;
  description: string;
  group_id: string;
  rule_type: 'score_based';
  forms: FormConfig[];
  min_score?: number;
  max_score?: number;
  operator: 'gte' | 'lte' | 'eq' | 'between';
  is_active: boolean;
}

export function GroupAssignmentManagementClient() {
  const [rules, setRules] = useState<GroupAssignmentRule[]>([]);
  const [groups, setGroups] = useState<PatientGroup[]>([]);
  const [availableForms, setAvailableForms] = useState<Array<{ form_id: string, title: string }>>([]);
  const [patients, setPatients] = useState<Array<{
    id: string;
    first_name: string;
    last_name: string;
    groups: PatientGroup[];
  }>>([]);
  const [assignments, setAssignments] = useState<PatientGroupAssignment[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<GroupAssignmentRule | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PatientGroup | null>(null);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');
  const [selectedGroupIdForEvents, setSelectedGroupIdForEvents] = useState<string>('');

  const [createForm, setCreateForm] = useState<CreateRuleForm>({
    name: '',
    description: '',
    group_id: '',
    rule_type: 'score_based',
    forms: [{ form_id: '', weight: 1.0 }],
    min_score: undefined,
    max_score: undefined,
    operator: 'gte',
    is_active: true,
  });

  const [editForm, setEditForm] = useState<CreateRuleForm>({
    name: '',
    description: '',
    group_id: '',
    rule_type: 'score_based',
    forms: [{ form_id: '', weight: 1.0 }],
    min_score: undefined,
    max_score: undefined,
    operator: 'gte',
    is_active: true,
  });

  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const [editGroupForm, setEditGroupForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rulesData, groupsData, formsData, patientsData, assignmentsData] = await Promise.all([
        getGroupAssignmentRules(),
        getPatientGroups(),
        getAvailableForms(),
        getPatientsWithGroups(),
        getPatientGroupAssignments()
      ]);

      setRules(rulesData);
      setGroups(groupsData);
      setAvailableForms(formsData);
      setPatients(patientsData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!createForm.name || !createForm.group_id || createForm.forms.length === 0) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    try {
      const ruleConfig = {
        forms: createForm.forms.filter(f => f.form_id),
        min_score: createForm.min_score,
        max_score: createForm.max_score,
        operator: createForm.operator
      };

      const newRule = await createGroupAssignmentRule({
        name: createForm.name,
        description: createForm.description,
        group_id: createForm.group_id,
        rule_type: createForm.rule_type,
        rule_config: ruleConfig,
        is_active: createForm.is_active
      });

      setRules([...rules, newRule]);
      setIsCreateDialogOpen(false);
      resetCreateForm();
      toast.success('สร้างเงื่อนไขการแบ่งกลุ่มสำเร็จ');
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างเงื่อนไข');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRule = async () => {
    if (!editingRule) return;

    setIsLoading(true);
    try {
      const ruleConfig = {
        forms: editForm.forms.filter(f => f.form_id),
        min_score: editForm.min_score,
        max_score: editForm.max_score,
        operator: editForm.operator
      };

      const updatedRule = await updateGroupAssignmentRule(editingRule.id, {
        name: editForm.name,
        description: editForm.description,
        group_id: editForm.group_id,
        rule_type: editForm.rule_type,
        rule_config: ruleConfig,
        is_active: editForm.is_active
      });

      setRules(rules.map(r => r.id === editingRule.id ? updatedRule : r));
      setIsEditDialogOpen(false);
      setEditingRule(null);
      toast.success('อัปเดตเงื่อนไขสำเร็จ');
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตเงื่อนไข');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setIsLoading(true);
    try {
      await deleteGroupAssignmentRule(ruleId);
      setRules(rules.filter(r => r.id !== ruleId));
      toast.success('ลบเงื่อนไขสำเร็จ');
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('เกิดข้อผิดพลาดในการลบเงื่อนไข');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculateAll = async () => {
    setIsLoading(true);
    try {
      const result = await recalculateAllPatientGroups();
      toast.success(`คำนวณกลุ่มใหม่สำเร็จ: ประมวลผล ${result.processed} คน`);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error recalculating groups:', error);
      toast.error('เกิดข้อผิดพลาดในการคำนวณกลุ่มใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAssign = async (patientId: string) => {
    setIsLoading(true);
    try {
      const result = await manuallyAssignPatientGroup(patientId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`ประเมินกลุ่มสำเร็จ: เพิ่มเข้า ${result.new_memberships || 0} กลุ่มใหม่`);
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Error manually assigning patient:', error);
      toast.error('เกิดข้อผิดพลาดในการประเมินกลุ่ม');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error('กรุณากรอกชื่อกลุ่ม');
      return;
    }

    setIsLoading(true);
    try {
      const newGroup = await createPatientGroup({
        name: groupForm.name,
        description: groupForm.description,
        color: groupForm.color
      });

      setGroups([...groups, newGroup]);
      setIsGroupDialogOpen(false);
      resetGroupForm();
      toast.success('สร้างกลุ่มใหม่สำเร็จ');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างกลุ่ม');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGroup = async () => {
    if (!editingGroup) return;

    setIsLoading(true);
    try {
      const updatedGroup = await updatePatientGroup(editingGroup.id, {
        name: editGroupForm.name,
        description: editGroupForm.description,
        color: editGroupForm.color
      });

      setGroups(groups.map(g => g.id === editingGroup.id ? updatedGroup : g));
      setIsEditGroupDialogOpen(false);
      setEditingGroup(null);
      toast.success('อัปเดตกลุ่มสำเร็จ');
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตกลุ่ม');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setIsLoading(true);
    try {
      await deletePatientGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      toast.success('ลบกลุ่มสำเร็จ');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('เกิดข้อผิดพลาดในการลบกลุ่ม');
    } finally {
      setIsLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      group_id: '',
      rule_type: 'score_based',
      forms: [{ form_id: '', weight: 1.0 }],
      min_score: undefined,
      max_score: undefined,
      operator: 'gte',
      is_active: true,
    });
  };

  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  };

  const openEditDialog = (rule: GroupAssignmentRule) => {
    setEditingRule(rule);
    setEditForm({
      name: rule.name,
      description: rule.description || '',
      group_id: rule.group_id,
      rule_type: rule.rule_type as 'score_based',
      forms: rule.rule_config.forms || [{ form_id: '', weight: 1.0 }],
      min_score: rule.rule_config.min_score,
      max_score: rule.rule_config.max_score,
      operator: rule.rule_config.operator || 'gte',
      is_active: rule.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const openEditGroupDialog = (group: PatientGroup) => {
    setEditingGroup(group);
    setEditGroupForm({
      name: group.name,
      description: group.description || '',
      color: group.color || '#3B82F6'
    });
    setIsEditGroupDialogOpen(true);
  };

  const addFormConfig = (isEdit = false) => {
    const formSetter = isEdit ? setEditForm : setCreateForm;
    const currentForm = isEdit ? editForm : createForm;

    formSetter({
      ...currentForm,
      forms: [...currentForm.forms, { form_id: '', weight: 1.0 }]
    });
  };

  const removeFormConfig = (index: number, isEdit = false) => {
    const formSetter = isEdit ? setEditForm : setCreateForm;
    const currentForm = isEdit ? editForm : createForm;

    formSetter({
      ...currentForm,
      forms: currentForm.forms.filter((_, i) => i !== index)
    });
  };

  const updateFormConfig = (index: number, field: keyof FormConfig, value: any, isEdit = false) => {
    const formSetter = isEdit ? setEditForm : setCreateForm;
    const currentForm = isEdit ? editForm : createForm;

    const updatedForms = currentForm.forms.map((form, i) =>
      i === index ? { ...form, [field]: value } : form
    );

    formSetter({
      ...currentForm,
      forms: updatedForms
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="groups">จัดการกลุ่ม</TabsTrigger>
          <TabsTrigger value="rules">เงื่อนไขการแบ่งกลุ่ม</TabsTrigger>
          <TabsTrigger value="events">กิจกรรมกลุ่ม</TabsTrigger>
          <TabsTrigger value="patients">ผู้ใช้บริการในกลุ่ม</TabsTrigger>
          <TabsTrigger value="history">ประวัติการแบ่งกลุ่ม</TabsTrigger>
          <TabsTrigger value="tools">เครื่องมือ</TabsTrigger>
        </TabsList>

        {/* Groups Management Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">จัดการกลุ่มผู้ใช้บริการ</h2>
              <p className="text-gray-600">สร้าง แก้ไข และจัดการกลุ่มผู้ใช้บริการ</p>
            </div>

            <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button >
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
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      placeholder="เช่น กลุ่มพิเศษ"
                    />
                  </div>

                  <div>
                    <Label htmlFor="group-description">รายละเอียด</Label>
                    <Textarea
                      id="group-description"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      placeholder="อธิบายลักษณะของกลุ่ม"
                    />
                  </div>

                  <div>
                    <Label htmlFor="group-color">สีกลุ่ม</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="group-color"
                        type="color"
                        value={groupForm.color}
                        onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={groupForm.color}
                        onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsGroupDialogOpen(false)}
                    disabled={isLoading}
                  >
                    ยกเลิก
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={isLoading}>
                    {isLoading ? 'กำลังสร้าง...' : 'สร้างกลุ่ม'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Groups List */}
          <div className="grid gap-4">
            {groups.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">ยังไม่มีกลุ่มผู้ใช้บริการ</h3>
                    <p className="text-gray-500">เริ่มต้นด้วยการสร้างกลุ่มแรก</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              groups.map((group) => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
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
                          onClick={() => openEditGroupDialog(group)}
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
                                onClick={() => handleDeleteGroup(group.id)}
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
              ))
            )}
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">เงื่อนไขการแบ่งกลุ่ม</h2>
              <p className="text-gray-600">กำหนดเงื่อนไขสำหรับเพิ่มผู้ใช้บริการเข้ากลุ่มอัตโนมัติ (สามารถอยู่ในหลายกลุ่มได้)</p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                    <div>
                      <Label htmlFor="create-name">ชื่อเงื่อนไข *</Label>
                      <Input
                        id="create-name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        placeholder="เช่น ผู้ใช้บริการเสี่ยงสูง"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="create-description">รายละเอียด</Label>
                    <Textarea
                      id="create-description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="อธิบายเงื่อนไขการแบ่งกลุ่ม"
                    />
                  </div>

                  <div>
                    <Label htmlFor="create-group">กลุ่มเป้าหมาย *</Label>
                    <Select
                      value={createForm.group_id}
                      onValueChange={(value) => setCreateForm({ ...createForm, group_id: value })}
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
                        onClick={() => addFormConfig(false)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        เพิ่มแบบแบบสอบถาม
                      </Button>
                    </div>

                    {createForm.forms.map((form, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-6">
                          <Select
                            value={form.form_id}
                            onValueChange={(value) => updateFormConfig(index, 'form_id', value, false)}
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
                            value={form.weight}
                            onChange={(e) => updateFormConfig(index, 'weight', parseFloat(e.target.value) || 1, false)}
                            placeholder="น้ำหนัก"
                          />
                        </div>
                        <div className="col-span-2">
                          {createForm.forms.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFormConfig(index, false)}
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
                        value={createForm.operator}
                        onValueChange={(value: any) => setCreateForm({ ...createForm, operator: value })}
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
                        value={createForm.min_score || ''}
                        onChange={(e) => setCreateForm({ ...createForm, min_score: parseFloat(e.target.value) || undefined })}
                        placeholder="0"
                      />
                    </div>
                    {createForm.operator === 'between' && (
                      <div>
                        <Label htmlFor="create-max-score">คะแนน</Label>
                        <Input
                          id="create-max-score"
                          type="number"
                          step="0.1"
                          value={createForm.max_score || ''}
                          onChange={(e) => setCreateForm({ ...createForm, max_score: parseFloat(e.target.value) || undefined })}
                          placeholder="100"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isLoading}
                  >
                    ยกเลิก
                  </Button>
                  <Button onClick={handleCreateRule} disabled={isLoading}>
                    {isLoading ? 'กำลังสร้าง...' : 'สร้างเงื่อนไข'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Rules List */}
          <div className="grid gap-4">
            {rules.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">ยังไม่มีเงื่อนไขการแบ่งกลุ่ม</h3>
                    <p className="text-gray-500">เริ่มต้นด้วยการสร้างเงื่อนไขแรก</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              rules.map((rule) => (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
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
                          onClick={() => openEditDialog(rule)}
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
                                onClick={() => handleDeleteRule(rule.id)}
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
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">กิจกรรมกลุ่ม</h2>
              <p className="text-gray-600">จัดการกิจกรรมสำหรับแต่ละกลุ่มผู้ใช้บริการ</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={activeTab === 'events' ? (selectedGroupIdForEvents || 'all') : 'all'}
                onValueChange={(value) => setSelectedGroupIdForEvents(value === 'all' ? '' : value)}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="ทุกกลุ่ม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกกลุ่ม</SelectItem>
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
          </div>
          
          <GroupEventsManagement groups={groups} selectedGroupId={selectedGroupIdForEvents} />
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">ผู้ใช้บริการในกลุ่ม</h2>
              <p className="text-gray-600">ดูการสมาชิกภาพในกลุ่มของผู้ใช้บริการ (สามารถอยู่ในหลายกลุ่มได้)</p>
            </div>
          </div>

          <div className="grid gap-4">
            {patients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {patient.groups && patient.groups.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {[...patient.groups].sort((a, b) => a.name.localeCompare(b.name)).map((group, index) => (
                                <div key={group.id} className="flex items-center gap-1">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: group.color }}
                                  />
                                  <span>{group.name}</span>
                                  {index < patient.groups.length - 1 && <span>,</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">ยังไม่ได้จัดกลุ่ม</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManualAssign(patient.id)}
                      disabled={isLoading}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      ประเมินกลุ่มใหม่
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">ประวัติการแบ่งกลุ่ม</h2>
            <p className="text-gray-600">ประวัติการเปลี่ยนแปลงกลุ่มผู้ใช้บริการ</p>
          </div>

          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold mb-1">
                        ผู้ใช้บริการ ID: {assignment.patient_id}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {assignment.assignment_reason}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          {assignment.old_group && (
                            <>
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: assignment.old_group.color }}
                              />
                              <span>จาก: {assignment.old_group.name}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.new_group && (
                            <>
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: assignment.new_group.color }}
                              />
                              <span>ไป: {assignment.new_group.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(assignment.created_at).toLocaleString('th-TH')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">เครื่องมือจัดการ</h2>
            <p className="text-gray-600">เครื่องมือสำหรับจัดการระบบแบ่งกลุ่ม</p>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  คำนวณกลุ่มใหม่ทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  ประเมินและเพิ่มผู้ใช้บริการเข้ากลุ่มที่เหมาะสมทั้งหมดตามเงื่อนไขปัจจุบัน (สามารถอยู่ในหลายกลุ่มได้)
                </p>
                <Button
                  onClick={handleRecalculateAll}
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isLoading ? 'กำลังประเมิน...' : 'ประเมินกลุ่มใหม่ทั้งหมด'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขเงื่อนไขการแบ่งกลุ่ม</DialogTitle>
            <DialogDescription>
              อัปเดตเงื่อนไขสำหรับเพิ่มผู้ใช้บริการเข้ากลุ่มอัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <div>
                <Label htmlFor="edit-name">ชื่อเงื่อนไข *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="เช่น ผู้ใช้บริการเสี่ยงสูง"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">รายละเอียด</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="อธิบายเงื่อนไขการแบ่งกลุ่ม"
              />
            </div>

            <div>
              <Label htmlFor="edit-group">กลุ่มเป้าหมาย *</Label>
              <Select
                value={editForm.group_id}
                onValueChange={(value) => setEditForm({ ...editForm, group_id: value })}
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
                  onClick={() => addFormConfig(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  เพิ่มแบบแบบสอบถาม
                </Button>
              </div>

              {editForm.forms.map((form, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Select
                      value={form.form_id}
                      onValueChange={(value) => updateFormConfig(index, 'form_id', value, true)}
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
                      value={form.weight}
                      onChange={(e) => updateFormConfig(index, 'weight', parseFloat(e.target.value) || 1, true)}
                      placeholder="น้ำหนัก"
                    />
                  </div>
                  <div className="col-span-2">
                    {editForm.forms.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFormConfig(index, true)}
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
                <Label htmlFor="edit-operator">เงื่อนไข</Label>
                <Select
                  value={editForm.operator}
                  onValueChange={(value: any) => setEditForm({ ...editForm, operator: value })}
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
                <Label htmlFor="edit-min-score">คะแนนต่ำสุด</Label>
                <Input
                  id="edit-min-score"
                  type="number"
                  step="0.1"
                  value={editForm.min_score || ''}
                  onChange={(e) => setEditForm({ ...editForm, min_score: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                />
              </div>
              {editForm.operator === 'between' && (
                <div>
                  <Label htmlFor="edit-max-score">คะแนนสูงสุด</Label>
                  <Input
                    id="edit-max-score"
                    type="number"
                    step="0.1"
                    value={editForm.max_score || ''}
                    onChange={(e) => setEditForm({ ...editForm, max_score: parseFloat(e.target.value) || undefined })}
                    placeholder="100"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is-active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit-is-active">เปิดใช้งานเงื่อนไขนี้</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleEditRule} disabled={isLoading}>
              {isLoading ? 'กำลังอัปเดต...' : 'อัปเดต'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขกลุ่มผู้ใช้บริการ</DialogTitle>
            <DialogDescription>
              อัปเดตข้อมูลกลุ่มผู้ใช้บริการ
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-group-name">ชื่อกลุ่ม *</Label>
              <Input
                id="edit-group-name"
                value={editGroupForm.name}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                placeholder="เช่น กลุ่มพิเศษ"
              />
            </div>

            <div>
              <Label htmlFor="edit-group-description">รายละเอียด</Label>
              <Textarea
                id="edit-group-description"
                value={editGroupForm.description}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, description: e.target.value })}
                placeholder="อธิบายลักษณะของกลุ่ม"
              />
            </div>

            <div>
              <Label htmlFor="edit-group-color">สีกลุ่ม</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="edit-group-color"
                  type="color"
                  value={editGroupForm.color}
                  onChange={(e) => setEditGroupForm({ ...editGroupForm, color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={editGroupForm.color}
                  onChange={(e) => setEditGroupForm({ ...editGroupForm, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditGroupDialogOpen(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleEditGroup} disabled={isLoading}>
              {isLoading ? 'กำลังอัปเดต...' : 'อัปเดต'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
