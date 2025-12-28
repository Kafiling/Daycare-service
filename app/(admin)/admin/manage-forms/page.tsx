"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
    Search, 
    Plus, 
    MoreVertical, 
    Edit, 
    Trash2, 
    Eye, 
    Copy, 
    Filter,
    FileText,
    Clock,
    Flag,
    Users,
    Calendar,
    Heart,
    Activity,
    AlertCircle,
    User,
    ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
// Import from the same service as AvailableSurveys
import { type Form } from '@/app/service/patient-client';
import { logFormStatusChange } from './_actions/logFormStatusChange';

// Icon mapping for form categories (same as AvailableSurveys)
const getCategoryIcon = (label?: string) => {
    if (!label) return FileText;
    
    switch (label.toLowerCase()) {
        case 'สุขภาพทั่วไป':
        case 'สุขภาพ':
            return Heart;
        case 'สุขภาพจิต':
        case 'จิตใจ':
            return Activity;
        case 'ความปลอดภัย':
        case 'ปลอดภัย':
            return AlertCircle;
        case 'กิจกรรมประจำวัน':
        case 'กิจกรรม':
        case 'การดูแล':
            return User;
        default:
            return FileText;
    }
};

const getPriorityConfig = (priority?: string) => {
    switch (priority?.toLowerCase()) {
        case 'urgent':
            return { variant: 'destructive' as const, label: 'เร่งด่วน', color: 'bg-red-100 text-red-800' };
        case 'high':
            return { variant: 'destructive' as const, label: 'สำคัญ', color: 'bg-orange-100 text-orange-800' };
        case 'medium':
            return { variant: 'default' as const, label: 'ปานกลาง', color: 'bg-yellow-100 text-yellow-800' };
        case 'low':
            return { variant: 'secondary' as const, label: 'ไม่เร่งด่วน', color: 'bg-blue-100 text-blue-800' };
        default:
            return { variant: 'outline' as const, label: 'ปกติ', color: 'bg-gray-100 text-gray-800' };
    }
};

// Client-side API call function to get forms
async function fetchForms(): Promise<Form[]> {
    try {
        // Fetch ALL forms (both active and inactive) for admin panel
        const response = await fetch('/api/forms/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch forms');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching forms:', error);
        throw error;
    }
}

export default function ManageFormsPage() {
    const router = useRouter();
    const [forms, setForms] = useState<Form[]>([]);
    const [filteredForms, setFilteredForms] = useState<Form[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedForm, setSelectedForm] = useState<Form | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState('manage');

    // Load forms data using client-side API call
    useEffect(() => {
        const loadForms = async () => {
            try {
                const formsData = await fetchForms();
                setForms(formsData);
                setFilteredForms(formsData);
            } catch (error) {
                toast.error('ไม่สามารถโหลดข้อมูลแบบสอบถามได้');
                console.error('Error loading forms:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadForms();
    }, []);

    // Filter forms based on search and filters
    useEffect(() => {
        let filtered = forms;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(form => 
                form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                form.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                form.label?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(form => 
                statusFilter === 'active' ? form.is_active : !form.is_active
            );
        }

        // Priority filter
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(form => form.priority_level === priorityFilter);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(form => form.label === categoryFilter);
        }

        setFilteredForms(filtered);
    }, [forms, searchTerm, statusFilter, priorityFilter, categoryFilter]);

    const handleDelete = async (formId: string) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/forms/${formId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete form');
            }
            
            setForms(forms.filter(form => form.form_id !== formId));
            toast.success('ลบแบบสอบถามเรียบร้อยแล้ว');
            setShowDeleteDialog(false);
            setSelectedForm(null);
        } catch (error) {
            toast.error('ไม่สามารถลบแบบสอบถามได้');
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async (form: Form) => {
        try {
            const duplicateData = {
                ...form,
                title: `${form.title} (สำเนา)`,
                // Keep the original form_id so the server can fetch the questions
                // The server will generate a new ID for the duplicated form
            };
            
            const response = await fetch('/api/forms/duplicate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(duplicateData),
            });
            
            if (!response.ok) {
                throw new Error('Failed to duplicate form');
            }
            
            const duplicatedForm = await response.json();
            setForms([duplicatedForm, ...forms]);
            toast.success('คัดลอกแบบสอบถามเรียบร้อยแล้ว');
        } catch (error) {
            toast.error('ไม่สามารถคัดลอกแบบสอบถามได้');
            console.error(error);
        }
    };

    const toggleFormStatus = async (formId: string) => {
        try {
            const form = forms.find(f => f.form_id === formId);
            if (!form) return;
            
            const response = await fetch(`/api/forms/${formId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_active: !form.is_active }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to toggle form status');
            }
            
            const updatedForm = await response.json();
            
            // Update local state immediately for responsive UI
            const updatedForms = forms.map(f => 
                f.form_id === formId ? updatedForm : f
            );
            setForms(updatedForms);
            
            // Log the status change activity
            await logFormStatusChange(
                updatedForm.form_id,
                updatedForm.title,
                updatedForm.is_active
            );
            
            toast.success(`${updatedForm.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}แบบสอบถามเรียบร้อยแล้ว`);
            
            // Optionally refetch to ensure data is in sync with database
            // Uncomment if you want to always fetch fresh data after toggle
            // const freshForms = await fetchForms();
            // setForms(freshForms);
        } catch (error) {
            toast.error('ไม่สามารถเปลี่ยนสถานะแบบสอบถามได้');
            console.error(error);
        }
    };

    // Get unique categories for filter
    const uniqueCategories = Array.from(new Set(forms.map(form => form.label).filter(Boolean))) as string[];

    if (isLoading) {
        return (
            <div className="container mx-auto p-8">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push('/admin')}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            กลับไปยังแผงควบคุม
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">จัดการแบบสอบถาม</h1>
                            <p className="text-muted-foreground">จัดการและดูแลแบบสอบถามประเมินทั้งหมด</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manage">จัดการแบบสอบถาม</TabsTrigger>
                        <TabsTrigger value="create">สร้างแบบสอบถามใหม่</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manage" className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-8 w-8 text-green-600" />
                                        <div>
                                            <p className="text-2xl font-bold">{forms.filter(f => f.is_active).length}</p>
                                            <p className="text-sm text-muted-foreground">แบบสอบถามที่ใช้งานอยู่</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-8 w-8 text-blue-600" />
                                        <div>
                                            <p className="text-2xl font-bold">{forms.length}</p>
                                            <p className="text-sm text-muted-foreground">แบบสอบถามทั้งหมด</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filters */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="ค้นหาแบบสอบถาม..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="สถานะ" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                                                <SelectItem value="active">ใช้งานอยู่</SelectItem>
                                                <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="ความสำคัญ" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">ทั้งหมด</SelectItem>
                                                <SelectItem value="urgent">เร่งด่วน</SelectItem>
                                                <SelectItem value="high">สำคัญ</SelectItem>
                                                <SelectItem value="medium">ปานกลาง</SelectItem>
                                                <SelectItem value="low">ไม่เร่งด่วน</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="หมวดหมู่" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">หมวดหมู่ทั้งหมด</SelectItem>
                                                {uniqueCategories.map((category) => (
                                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                setSearchTerm('');
                                                setStatusFilter('all');
                                                setPriorityFilter('all');
                                                setCategoryFilter('all');
                                            }}
                                            className="gap-2"
                                        >
                                            <Filter className="h-4 w-4" />
                                            รีเซ็ต
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Forms List */}
                        <div className="grid grid-cols-1 gap-4">
                            {filteredForms.length === 0 ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">ไม่พบแบบสอบถาม</h3>
                                        <p className="text-muted-foreground mb-4">ไม่มีแบบสอบถามที่ตรงกับเงื่อนไขการค้นหา</p>
                                        <Button onClick={() => setActiveTab('create')} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            สร้างแบบสอบถามใหม่
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredForms.map((form) => {
                                    const priorityConfig = getPriorityConfig(form.priority_level);
                                    const IconComponent = getCategoryIcon(form.label);
                                    
                                    return (
                                        <Card key={form.form_id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <IconComponent className="h-5 w-5 text-primary" />
                                                            <h3 className="text-lg font-semibold">{form.title}</h3>
                                                            <Badge variant={form.is_active ? "default" : "secondary"}>
                                                                {form.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                                                            </Badge>
                                                            <Badge className={priorityConfig.color}>
                                                                {priorityConfig.label}
                                                            </Badge>
                                                        </div>
                                                        {form.description && (
                                                            <p className="text-muted-foreground mb-3">{form.description}</p>
                                                        )}
                                                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                            {form.label && (
                                                                <div className="flex items-center gap-1">
                                                                    <FileText className="h-4 w-4" />
                                                                    <span>หมวด: {form.label}</span>
                                                                </div>
                                                            )}
                                                            {form.time_to_complete && (
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="h-4 w-4" />
                                                                    <span>{form.time_to_complete} นาที</span>
                                                                </div>
                                                            )}
                                                            {form.created_at && (
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span>สร้าง: {new Date(form.created_at).toLocaleDateString('th-TH')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem 
                                                                onClick={() => {
                                                                    setSelectedForm(form);
                                                                    setShowDetailsDialog(true);
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                ดูรายละเอียด
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => router.push(`/admin/edit-form/${form.form_id}`)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                แก้ไข
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDuplicate(form)}>
                                                                <Copy className="h-4 w-4 mr-2" />
                                                                คัดลอก
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => toggleFormStatus(form.form_id)}>
                                                                <FileText className="h-4 w-4 mr-2" />
                                                                {form.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                onClick={() => {
                                                                    setSelectedForm(form);
                                                                    setShowDeleteDialog(true);
                                                                }}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                ลบ
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="create" className="space-y-6">
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">สร้างแบบสอบถามใหม่</h3>
                                <p className="text-muted-foreground mb-4">คลิกปุ่มด้านล่างเพื่อไปยังหน้าสร้างแบบสอบถามใหม่</p>
                                <Button onClick={() => router.push('/admin/create-form')} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    เริ่มสร้างแบบสอบถาม
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบแบบสอบถาม</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณแน่ใจหรือไม่ว่าต้องการลบแบบสอบถาม "{selectedForm?.title}" 
                            การดำเนินการนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => selectedForm && handleDelete(selectedForm.form_id)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'กำลังลบ...' : 'ลบแบบสอบถาม'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Form Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>รายละเอียดแบบสอบถาม</DialogTitle>
                        <DialogDescription>
                            ข้อมูลโดยละเอียดของแบบสอบถาม "{selectedForm?.title}"
                        </DialogDescription>
                    </DialogHeader>
                    {selectedForm && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">ชื่อแบบสอบถาม</Label>
                                    <p className="text-sm text-muted-foreground">{selectedForm.title}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">หมวดหมู่</Label>
                                    <p className="text-sm text-muted-foreground">{selectedForm.label || 'ไม่ระบุ'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">เวลาที่ใช้</Label>
                                    <p className="text-sm text-muted-foreground">{selectedForm.time_to_complete || 'ไม่ระบุ'} นาที</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">ระดับความสำคัญ</Label>
                                    <Badge className={getPriorityConfig(selectedForm.priority_level).color}>
                                        {getPriorityConfig(selectedForm.priority_level).label}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">สถานะ</Label>
                                    <Badge variant={selectedForm.is_active ? "default" : "secondary"}>
                                        {selectedForm.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">วันที่สร้าง</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedForm.created_at ? new Date(selectedForm.created_at).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                                    </p>
                                </div>
                            </div>
                            {selectedForm.description && (
                                <div>
                                    <Label className="text-sm font-medium">คำอธิบาย</Label>
                                    <p className="text-sm text-muted-foreground">{selectedForm.description}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                            ปิด
                        </Button>
                        <Button onClick={() => {
                            setShowDetailsDialog(false);
                            if (selectedForm) {
                                router.push(`/admin/edit-form/${selectedForm.form_id}`);
                            }
                        }}>
                            แก้ไขแบบสอบถาม
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}