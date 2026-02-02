'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, History, Clock, Activity, Thermometer } from "lucide-react";
import { checkInPatientAction, updateCheckInAction } from "@/app/(main)/patient/[id]/home/_actions/checkin";
import { toast } from "sonner";
import type { CheckIn } from "@/app/service/checkin";
import { toThaiDateTime, toThaiTimeShort } from '@/lib/timezone';

interface PatientCheckInProps {
  patientId: string;
  todayCheckIn: CheckIn | null;
  history: CheckIn[];
  latestVitals?: { weight?: number; height?: number } | null;
}

export function PatientCheckIn({ patientId, todayCheckIn, history, latestVitals }: PatientCheckInProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const isEditMode = todayCheckIn !== null;

  const openDialog = () => {
    if (todayCheckIn) {
      // Pre-fill with existing data when editing
      setSystolicBp(todayCheckIn.systolic_bp?.toString() || '');
      setDiastolicBp(todayCheckIn.diastolic_bp?.toString() || '');
      setHeartRate(todayCheckIn.heart_rate?.toString() || '');
      setTemperature(todayCheckIn.temperature?.toString() || '');
      setWeight(todayCheckIn.weight?.toString() || '');
      setHeight(todayCheckIn.height?.toString() || '');
    } else {
      // Clear fields for new check-in, but prefill weight/height from latest check-in
      setSystolicBp('');
      setDiastolicBp('');
      setHeartRate('');
      setTemperature('');
      setWeight(latestVitals?.weight?.toString() || '');
      setHeight(latestVitals?.height?.toString() || '');
    }
    setIsCheckInDialogOpen(true);
  };

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      const vitals = {
        systolic_bp: systolicBp ? parseInt(systolicBp) : undefined,
        diastolic_bp: diastolicBp ? parseInt(diastolicBp) : undefined,
        heart_rate: heartRate ? parseInt(heartRate) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
      };

      let result;
      if (isEditMode && todayCheckIn) {
        console.log('Editing check-in:', todayCheckIn.id);
        result = await updateCheckInAction(patientId, todayCheckIn.id, vitals);
        if (result.success) {
          toast.success("อัปเดตข้อมูลสำเร็จ");
        }
      } else {
        result = await checkInPatientAction(patientId, vitals);
        if (result.success) {
          toast.success("เช็คอินสำเร็จ");
        }
      }

      if (result.success) {
        setIsCheckInDialogOpen(false);
        setSystolicBp('');
        setDiastolicBp('');
        setHeartRate('');
        setTemperature('');
        setWeight('');
        setHeight('');
      } else {
        toast.error(isEditMode ? "อัปเดตข้อมูลล้มเหลว" : "เช็คอินล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return toThaiDateTime(dateString, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex gap-2">
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogTrigger asChild>
          {todayCheckIn ? (
            <Button 
              variant="outline" 
              className="gap-2 text-pink-600 border-pink-200 bg-pink-50 hover:bg-pink-100"
              onClick={openDialog}
            >
              <CheckCircle2 className="h-4 w-4" />
              เช็คอินแล้ว ({toThaiTimeShort(todayCheckIn.check_in_time)})
            </Button>
          ) : (
            <Button className="gap-2" onClick={openDialog}>
              <Clock className="h-4 w-4" />
              เช็คอิน
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {isEditMode ? 'แก้ไขสัญญาณชีพ' : 'บันทึกสัญญาณชีพ'}
            </DialogTitle>
          </DialogHeader>
            <div className="space-y-4 mt-4">
              {isEditMode && todayCheckIn && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <div className="text-yellow-600 mt-0.5">⚠️</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">กำลังแก้ไขข้อมูลเช็คอิน</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {toThaiDateTime(todayCheckIn.check_in_time, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>ความดันเลือด (mmHg)</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Systolic"
                      value={systolicBp}
                      onChange={(e) => setSystolicBp(e.target.value)}
                      min="0"
                      max="300"
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">ค่าบน</span>
                  </div>
                  <span className="text-muted-foreground">/</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Diastolic"
                      value={diastolicBp}
                      onChange={(e) => setDiastolicBp(e.target.value)}
                      min="0"
                      max="200"
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">ค่าล่าง</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heart-rate">อัตราการเต้นของหัวใจ (bpm)</Label>
                <Input
                  id="heart-rate"
                  type="number"
                  placeholder="ครั้งต่อนาที"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  min="0"
                  max="300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature" className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  อุณหภูมิที่วัดได้ (°C)
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  placeholder="เช่น 36.5"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  min="30"
                  max="45"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">น้ำหนัก (กก.)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="กิโลกรัม"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="0"
                  max="300"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">ส่วนสูง (ซม.)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="เซนติเมตร"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min="0"
                  max="250"
                  step="0.1"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCheckInDialogOpen(false)}
                  disabled={isLoading}
                >
                  ยกเลิก
                </Button>
                <Button onClick={handleCheckIn} disabled={isLoading}>
                  {isLoading 
                    ? (isEditMode ? "กำลังอัปเดต..." : "กำลังบันทึก...") 
                    : (isEditMode ? "อัปเดตข้อมูล" : "บันทึกเช็คอิน")
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" />
            ประวัติ
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ประวัติการเช็คอิน</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">ไม่พบประวัติการเช็คอิน</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">วันที่</th>
                      <th className="text-left p-3 font-semibold">เวลา</th>
                      <th className="text-left p-3 font-semibold">ความดันเลือด</th>
                      <th className="text-left p-3 font-semibold">อัตราการเต้นหัวใจ</th>
                      <th className="text-left p-3 font-semibold">อุณหภูมิ</th>
                      <th className="text-left p-3 font-semibold">น้ำหนัก</th>
                      <th className="text-left p-3 font-semibold">ส่วนสูง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((checkIn) => (
                      <tr key={checkIn.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          {toThaiDateTime(checkIn.check_in_time, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="p-3">
                          {toThaiTimeShort(checkIn.check_in_time)}
                        </td>
                        <td className="p-3">
                          {checkIn.systolic_bp && checkIn.diastolic_bp
                            ? `${checkIn.systolic_bp}/${checkIn.diastolic_bp} mmHg`
                            : '-'}
                        </td>
                        <td className="p-3">
                          {checkIn.heart_rate ? `${checkIn.heart_rate} bpm` : '-'}
                        </td>
                        <td className="p-3">
                          {checkIn.temperature ? `${checkIn.temperature} °C` : '-'}
                        </td>
                        <td className="p-3">
                          {checkIn.weight ? `${checkIn.weight} กก.` : '-'}
                        </td>
                        <td className="p-3">
                          {checkIn.height ? `${checkIn.height} ซม.` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
