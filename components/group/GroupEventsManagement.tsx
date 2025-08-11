import React, { useState, useEffect } from 'react';
import { GroupEvent, PatientGroup, createGroupEvent, deleteGroupEvent, getGroupEvents, updateGroupEvent } from '@/app/service/group-assignment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface GroupEventsManagementProps {
  groups: PatientGroup[];
  selectedGroupId?: string;
}

export function GroupEventsManagement({ groups, selectedGroupId }: GroupEventsManagementProps) {
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<GroupEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    group_id: selectedGroupId || '',
    is_active: true
  });

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await getGroupEvents(selectedGroupId);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('ไม่สามารถโหลดข้อมูลกิจกรรมได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedGroupId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      event_time: '',
      group_id: selectedGroupId || '',
      is_active: true
    });
  };

  const openCreateDialog = () => {
    resetForm();
    if (selectedGroupId) {
      setFormData(prev => ({ ...prev, group_id: selectedGroupId }));
    }
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (event: GroupEvent) => {
    setCurrentEvent(event);
    const eventDate = format(new Date(event.event_datetime), 'yyyy-MM-dd');
    const eventTime = format(new Date(event.event_datetime), 'HH:mm');
    
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: eventDate,
      event_time: eventTime,
      group_id: event.group_id,
      is_active: event.is_active
    });
    
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (event: GroupEvent) => {
    setCurrentEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.event_date || !formData.event_time || !formData.group_id) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    setIsLoading(true);
    try {
      const eventDatetime = new Date(`${formData.event_date}T${formData.event_time}`).toISOString();
      
      const newEvent = await createGroupEvent({
        group_id: formData.group_id,
        title: formData.title,
        description: formData.description,
        event_datetime: eventDatetime,
        is_active: formData.is_active
      });
      
      if (newEvent) {
        toast.success('สร้างกิจกรรมสำเร็จ');
        setIsCreateDialogOpen(false);
        resetForm();
        loadEvents();
      } else {
        toast.error('ไม่สามารถสร้างกิจกรรมได้');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างกิจกรรม');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!currentEvent || !formData.title || !formData.event_date || !formData.event_time || !formData.group_id) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    setIsLoading(true);
    try {
      const eventDatetime = new Date(`${formData.event_date}T${formData.event_time}`).toISOString();
      
      const updatedEvent = await updateGroupEvent(currentEvent.id, {
        group_id: formData.group_id,
        title: formData.title,
        description: formData.description,
        event_datetime: eventDatetime,
        is_active: formData.is_active
      });
      
      if (updatedEvent) {
        toast.success('อัพเดทกิจกรรมสำเร็จ');
        setIsEditDialogOpen(false);
        setCurrentEvent(null);
        loadEvents();
      } else {
        toast.error('ไม่สามารถอัพเดทกิจกรรมได้');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพเดทกิจกรรม');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!currentEvent) return;
    
    setIsLoading(true);
    try {
      const success = await deleteGroupEvent(currentEvent.id);
      
      if (success) {
        toast.success('ลบกิจกรรมสำเร็จ');
        setIsDeleteDialogOpen(false);
        setCurrentEvent(null);
        loadEvents();
      } else {
        toast.error('ไม่สามารถลบกิจกรรมได้');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('เกิดข้อผิดพลาดในการลบกิจกรรม');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>จัดการกิจกรรมกลุ่ม</CardTitle>
          <CardDescription>เพิ่ม แก้ไข หรือลบกิจกรรมของกลุ่ม</CardDescription>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มกิจกรรม
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {selectedGroupId ? 'ไม่มีกิจกรรมในกลุ่มที่เลือก' : 'ไม่มีกิจกรรมในระบบ'}
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-lg flex items-center">
                      {event.title}
                      {!event.is_active && (
                        <Badge variant="outline" className="ml-2 text-xs">ไม่ใช้งาน</Badge>
                      )}
                    </h3>
                    {event.group && (
                      <Badge style={{ backgroundColor: event.group.color || '#888888' }} className="mt-1">
                        {event.group.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openDeleteDialog(event)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {event.description && <p className="text-muted-foreground mb-3">{event.description}</p>}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{format(new Date(event.event_datetime), 'EEEE d MMMM yyyy', { locale: th })}</span>
                  <Clock className="h-4 w-4 ml-4 mr-2" />
                  <span>{format(new Date(event.event_datetime), 'HH:mm น.')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มกิจกรรมใหม่</DialogTitle>
            <DialogDescription>กรอกรายละเอียดกิจกรรมที่ต้องการเพิ่ม</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group_id">กลุ่ม</Label>
              <Select 
                value={formData.group_id} 
                onValueChange={(value) => handleSelectChange('group_id', value)}
                disabled={!!selectedGroupId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกกลุ่ม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">ชื่อกิจกรรม</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="ชื่อกิจกรรม"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="รายละเอียดกิจกรรม"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">วันที่</Label>
                <Input
                  id="event_date"
                  name="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="event_time">เวลา</Label>
                <Input
                  id="event_time"
                  name="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_active" 
                checked={formData.is_active}
                onCheckedChange={(checked) => handleCheckboxChange('is_active', checked as boolean)}
              />
              <Label htmlFor="is_active">เปิดใช้งาน</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateEvent} disabled={isLoading}>
              {isLoading ? 'กำลังสร้าง...' : 'สร้างกิจกรรม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขกิจกรรม</DialogTitle>
            <DialogDescription>แก้ไขรายละเอียดกิจกรรม</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_group_id">กลุ่ม</Label>
              <Select 
                value={formData.group_id} 
                onValueChange={(value) => handleSelectChange('group_id', value)}
                disabled={!!selectedGroupId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกกลุ่ม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_title">ชื่อกิจกรรม</Label>
              <Input
                id="edit_title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="ชื่อกิจกรรม"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_description">รายละเอียด</Label>
              <Textarea
                id="edit_description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="รายละเอียดกิจกรรม"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_event_date">วันที่</Label>
                <Input
                  id="edit_event_date"
                  name="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_event_time">เวลา</Label>
                <Input
                  id="edit_event_time"
                  name="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit_is_active" 
                checked={formData.is_active}
                onCheckedChange={(checked) => handleCheckboxChange('is_active', checked as boolean)}
              />
              <Label htmlFor="edit_is_active">เปิดใช้งาน</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleUpdateEvent} disabled={isLoading}>
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบกิจกรรม</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบกิจกรรม "{currentEvent?.title}"? 
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} disabled={isLoading}>
              {isLoading ? 'กำลังลบ...' : 'ลบกิจกรรม'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
