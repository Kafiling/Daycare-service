'use client';

import { useState } from 'react';
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
import { Profile } from '@/app/service/nurse';
import {
    Plus,
    Edit,
    Key,
    Trash2,
    Mail,
    User,
    Briefcase,
    Calendar
} from 'lucide-react';
import { createStaff, updateStaff, resetStaffPassword, deleteStaff } from './actions';
import { toast } from 'sonner';

interface StaffManagementClientProps {
    initialStaff: Profile[];
}

interface CreateStaffForm {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    username: string;
    title: string;
    position: string;
}

interface EditStaffForm {
    first_name: string;
    last_name: string;
    username: string;
    title: string;
    position: string;
}

const TITLE_OPTIONS = [
    { value: 'นาย', label: 'นาย' },
    { value: 'นาง', label: 'นาง' },
    { value: 'นางสาว', label: 'นางสาว' },
    { value: 'นายแพทย์', label: 'นายแพทย์' },
    { value: 'แพทย์หญิง', label: 'แพทย์หญิง' },
    { value: 'พยาบาล', label: 'พยาบาล' },
];

const POSITION_OPTIONS = [
    { value: 'พยาบาลวิชาชีพ', label: 'พยาบาลวิชาชีพ' },
    { value: 'พยาบาลผู้ช่วย', label: 'พยาบาลผู้ช่วย' },
    { value: 'แพทย์', label: 'แพทย์' },
    { value: 'เจ้าหน้าที่', label: 'เจ้าหน้าที่' },
];

export function StaffManagementClient({ initialStaff }: StaffManagementClientProps) {
    const [staff, setStaff] = useState<Profile[]>(initialStaff);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Profile | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
    const [resetPasswordStaff, setResetPasswordStaff] = useState<Profile | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [createForm, setCreateForm] = useState<CreateStaffForm>({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        username: '',
        title: '',
        position: '',
    });

    const [editForm, setEditForm] = useState<EditStaffForm>({
        first_name: '',
        last_name: '',
        username: '',
        title: '',
        position: '',
    });

    const handleCreateStaff = async () => {
        if (!createForm.email || !createForm.password || !createForm.first_name || !createForm.last_name) {
            toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
            return;
        }

        setIsLoading(true);
        try {
            const result = await createStaff(createForm);
            if (result.success) {
                toast.success('เพิ่มพนักงานใหม่สำเร็จ');
                setStaff([...staff, result.profile!]);
                setCreateForm({
                    email: '',
                    password: '',
                    first_name: '',
                    last_name: '',
                    username: '',
                    title: '',
                    position: '',
                });
                setIsCreateDialogOpen(false);
            } else {
                toast.error(result.error || 'เกิดข้อผิดพลาดในการเพิ่มพนักงาน');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการเพิ่มพนักงาน');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditStaff = async () => {
        if (!editingStaff) return;

        setIsLoading(true);
        try {
            const result = await updateStaff(editingStaff.id, editForm);
            if (result.success) {
                toast.success('อัปเดตข้อมูลพนักงานสำเร็จ');
                setStaff(staff.map(s => s.id === editingStaff.id ? result.profile! : s));
                setIsEditDialogOpen(false);
                setEditingStaff(null);
            } else {
                toast.error(result.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetPasswordStaff || !newPassword) {
            toast.error('กรุณากรอกรหัสผ่านใหม่');
            return;
        }

        setIsLoading(true);
        try {
            const result = await resetStaffPassword(resetPasswordStaff.id, newPassword);
            if (result.success) {
                toast.success('รีเซ็ตรหัสผ่านสำเร็จ');
                setIsResetPasswordDialogOpen(false);
                setResetPasswordStaff(null);
                setNewPassword('');
            } else {
                toast.error(result.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteStaff = async (staffId: string) => {
        setIsLoading(true);
        try {
            const result = await deleteStaff(staffId);
            if (result.success) {
                toast.success('ลบพนักงานสำเร็จ');
                setStaff(staff.filter(s => s.id !== staffId));
            } else {
                toast.error(result.error || 'เกิดข้อผิดพลาดในการลบพนักงาน');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการลบพนักงาน');
        } finally {
            setIsLoading(false);
        }
    };

    const openEditDialog = (staffMember: Profile) => {
        setEditingStaff(staffMember);
        setEditForm({
            first_name: staffMember.first_name || '',
            last_name: staffMember.last_name || '',
            username: staffMember.username,
            title: staffMember.title || '',
            position: staffMember.position || '',
        });
        setIsEditDialogOpen(true);
    };

    const openResetPasswordDialog = (staffMember: Profile) => {
        setResetPasswordStaff(staffMember);
        setNewPassword('');
        setIsResetPasswordDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">รายชื่อพนักงาน</h2>
                    <p className="text-gray-600">พนักงานทั้งหมด {staff.length} คน</p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            เพิ่มพนักงานใหม่
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>เพิ่มพนักงานใหม่</DialogTitle>
                            <DialogDescription>
                                กรอกข้อมูลพนักงานใหม่และสร้างบัญชีในระบบ
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="create-title">คำนำหน้า</Label>
                                    <Select
                                        value={createForm.title}
                                        onValueChange={(value) => setCreateForm({ ...createForm, title: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกคำนำหน้า" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TITLE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="create-position">ตำแหน่ง</Label>
                                    <Select
                                        value={createForm.position}
                                        onValueChange={(value) => setCreateForm({ ...createForm, position: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกตำแหน่ง" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {POSITION_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="create-first-name">ชื่อ *</Label>
                                    <Input
                                        id="create-first-name"
                                        value={createForm.first_name}
                                        onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                                        placeholder="ชื่อ"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="create-last-name">นามสกุล *</Label>
                                    <Input
                                        id="create-last-name"
                                        value={createForm.last_name}
                                        onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                                        placeholder="นามสกุล"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="create-username">ชื่อผู้ใช้</Label>
                                <Input
                                    id="create-username"
                                    value={createForm.username}
                                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                                    placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                                />
                            </div>

                            <div>
                                <Label htmlFor="create-email">อีเมล *</Label>
                                <Input
                                    id="create-email"
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                    placeholder="example@email.com"
                                />
                            </div>

                            <div>
                                <Label htmlFor="create-password">รหัสผ่าน *</Label>
                                <Input
                                    id="create-password"
                                    type="password"
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                    placeholder="รหัสผ่านสำหรับเข้าสู่ระบบ"
                                />
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
                            <Button onClick={handleCreateStaff} disabled={isLoading}>
                                {isLoading ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Staff List */}
            <div className="grid gap-4">
                {staff.length === 0 ? (
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600">ยังไม่มีพนักงานในระบบ</h3>
                                <p className="text-gray-500">เริ่มต้นด้วยการเพิ่มพนักงานคนแรก</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    staff.map((staffMember) => (
                        <Card key={staffMember.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                {staffMember.title && `${staffMember.title} `}
                                                {staffMember.first_name} {staffMember.last_name}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-4 w-4" />
                                                    {staffMember.email}
                                                </div>
                                                {staffMember.username && (
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-4 w-4" />
                                                        {staffMember.username}
                                                    </div>
                                                )}
                                            </div>
                                            {staffMember.position && (
                                                <div className="mt-2">
                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" />
                                                        {staffMember.position}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(staffMember)}
                                            disabled={isLoading}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openResetPasswordDialog(staffMember)}
                                            disabled={isLoading}
                                        >
                                            <Key className="h-4 w-4" />
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" disabled={isLoading}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>ยืนยันการลบพนักงาน</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        คุณแน่ใจหรือว่าต้องการลบ {staffMember.title} {staffMember.first_name} {staffMember.last_name}
                                                        ออกจากระบบ? การดำเนินการนี้ไม่สามารถยกเลิกได้
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteStaff(staffMember.id)}
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

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูลพนักงาน</DialogTitle>
                        <DialogDescription>
                            อัปเดตข้อมูลของ {editingStaff?.first_name} {editingStaff?.last_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="edit-title">คำนำหน้า</Label>
                                <Select
                                    value={editForm.title}
                                    onValueChange={(value) => setEditForm({ ...editForm, title: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกคำนำหน้า" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TITLE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-position">ตำแหน่ง</Label>
                                <Select
                                    value={editForm.position}
                                    onValueChange={(value) => setEditForm({ ...editForm, position: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกตำแหน่ง" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {POSITION_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="edit-first-name">ชื่อ</Label>
                                <Input
                                    id="edit-first-name"
                                    value={editForm.first_name}
                                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-last-name">นามสกุล</Label>
                                <Input
                                    id="edit-last-name"
                                    value={editForm.last_name}
                                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="edit-username">ชื่อผู้ใช้</Label>
                            <Input
                                id="edit-username"
                                value={editForm.username}
                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            />
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
                        <Button onClick={handleEditStaff} disabled={isLoading}>
                            {isLoading ? 'กำลังอัปเดต...' : 'อัปเดต'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
                        <DialogDescription>
                            ตั้งรหัสผ่านใหม่สำหรับ {resetPasswordStaff?.first_name} {resetPasswordStaff?.last_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="ใส่รหัสผ่านใหม่"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsResetPasswordDialogOpen(false)}
                            disabled={isLoading}
                        >
                            ยกเลิก
                        </Button>
                        <Button onClick={handleResetPassword} disabled={isLoading}>
                            {isLoading ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
