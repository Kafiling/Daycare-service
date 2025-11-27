'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    Phone,
    Mail,
    MapPin,
    Weight,
    Ruler,
    Activity,
    User,
    ChevronDown,
    ChevronUp,
    Heart,
    Car,
    AlertTriangle,
    GraduationCap,
    Users
} from 'lucide-react';
import type { Patient } from '@/app/service/patient';
import { PatientCheckIn } from './PatientCheckIn';
import type { CheckIn } from '@/app/service/checkin';
import { Badge } from '@/components/ui/badge';

interface PatientInfoProps {
    patient: Patient;
    todayCheckIn?: CheckIn | null;
    history?: CheckIn[];
}

export default function PatientInfo({ patient, todayCheckIn, history }: PatientInfoProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateAge = (dateString: string) => {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getDiseaseLabel = (id: string) => {
        const diseases: Record<string, string> = {
            "none": "ไม่มี",
            "hypertension": "ความดันโลหิตสูง",
            "diabetes": "เบาหวาน",
            "cancer_non_skin": "มะเร็ง",
            "chronic_lung": "โรคปอดเรื้อรัง",
            "acute_coronary": "โรคหลอดเลือดหัวใจกำเริบ",
            "heart_failure": "ภาวะหัวใจวาย",
            "asthma": "โรคหอบหืด",
            "angina": "อาการแน่นหน้าอก",
            "arthritis": "ภาวะข้ออักเสบ",
            "stroke": "โรคหลอดเลือดสมอง",
            "kidney_disease": "โรคไต"
        };
        return diseases[id] || id;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    ข้อมูลผู้ใช้บริการ
                </CardTitle>
                {todayCheckIn !== undefined && history !== undefined && (
                    <PatientCheckIn 
                        patientId={patient.id} 
                        todayCheckIn={todayCheckIn} 
                        history={history} 
                    />
                )}
            </CardHeader>
            <CardContent>
                {/* Important Information (Always Visible) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">อายุ:</span>
                            <span className="font-medium">{calculateAge(patient.date_of_birth)} ปี</span>
                            <span className="text-xs text-muted-foreground">({formatDate(patient.date_of_birth)})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">เพศ:</span>
                            <span>{patient.gender === 'male' ? 'ชาย' : patient.gender === 'female' ? 'หญิง' : '-'}</span>
                        </div>
                        {patient.phone_num && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">โทรศัพท์:</span>
                                <span>{patient.phone_num}</span>
                            </div>
                        )}
                        {patient.caregiver_name && (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">ผู้ดูแล:</span>
                                <span>{patient.caregiver_name}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            {patient.weight && (
                                <div className="flex items-center gap-2">
                                    <Weight className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">น้ำหนัก:</span>
                                    <span>{patient.weight} กก.</span>
                                </div>
                            )}
                            {patient.height && (
                                <div className="flex items-center gap-2">
                                    <Ruler className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">ส่วนสูง:</span>
                                    <span>{patient.height} ซม.</span>
                                </div>
                            )}
                        </div>
                        {patient.weight && patient.height && (
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">BMI:</span>
                                <span className={`font-medium ${
                                    (patient.weight / Math.pow(patient.height / 100, 2)) > 25 ? 'text-orange-500' : 'text-green-600'
                                }`}>
                                    {(patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)}
                                </span>
                            </div>
                        )}
                        {patient.underlying_diseases && patient.underlying_diseases.length > 0 && !patient.underlying_diseases.includes('none') && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {patient.underlying_diseases.map((disease, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                        {getDiseaseLabel(disease)}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            {/* Removed alerts from here, moved to expanded view */}
                        </div>
                    </div>
                </div>

                {/* Expanded Information */}
                {isExpanded && (
                    <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                        {/* Personal Details */}
                        <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" /> ข้อมูลส่วนตัวเพิ่มเติม
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">สถานภาพ:</span>
                                    <span>{
                                        patient.marital_status === 'single' ? 'โสด' :
                                        patient.marital_status === 'married' ? 'สมรส' :
                                        patient.marital_status === 'divorced' ? 'หย่า' :
                                        patient.marital_status === 'widowed' ? 'หม้าย' : '-'
                                    }</span>
                                </div>
                                <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">การศึกษา:</span>
                                    <span>{
                                        patient.education_level === 'none' ? 'ไม่ได้เรียน' :
                                        patient.education_level === 'primary' ? 'ประถมศึกษา' :
                                        patient.education_level === 'lower_secondary' ? 'ม.ต้น' :
                                        patient.education_level === 'upper_secondary' ? 'ม.ปลาย' :
                                        patient.education_level === 'bachelor_plus' ? 'ปริญญาตรีขึ้นไป' : '-'
                                    }</span>
                                </div>
                                {patient.email && (
                                    <div className="grid grid-cols-2">
                                        <span className="text-muted-foreground">อีเมล:</span>
                                        <span className="truncate">{patient.email}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">แก้ไขล่าสุด:</span>
                                    <span>{formatDate(patient.updated_at)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Health Details */}
                        <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                                <Activity className="h-4 w-4" /> ข้อมูลสุขภาพเพิ่มเติม
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">ประวัติการหกล้ม:</span>
                                    <span className={patient.fall_history ? 'text-orange-600 font-medium' : ''}>
                                        {patient.fall_history ? 'เคย' : 'ไม่เคย'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">การเข้ารักษาตัว:</span>
                                    <span className={patient.hospitalization_history ? 'text-blue-600 font-medium' : ''}>
                                        {patient.hospitalization_history ? 'เคย (ใน 1 ปี)' : 'ไม่เคย'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" /> ที่อยู่
                            </h4>
                            <div className="text-sm">
                                {patient.address && <>{patient.address}<br /></>}
                                {patient.road && <>ถ. {patient.road}<br /></>}
                                {(patient.sub_district || patient.district) && (
                                    <>{patient.sub_district} {patient.district}<br /></>
                                )}
                                {(patient.province || patient.postal_num) && (
                                    <>{patient.province} {patient.postal_num}</>
                                )}
                                {patient.distance_from_home && (
                                    <div className="mt-2 text-muted-foreground">
                                        ระยะทาง: {patient.distance_from_home} กม.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Service Preferences */}
                        <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                                <Car className="h-4 w-4" /> การเดินทางและบริการ
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">การเดินทาง:</span>
                                    <span>{
                                        patient.transportation === 'self_drive' ? 'ขับรถมาเอง' :
                                        patient.transportation === 'relative' ? 'ญาติมาส่ง' :
                                        patient.transportation === 'bts' ? 'BTS' :
                                        patient.transportation || '-'
                                    }</span>
                                </div>
                                <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">ที่จอดรถ:</span>
                                    <span>{patient.parking_requirement ? 'ต้องการ' : 'ไม่ต้องการ'}</span>
                                </div>
                                <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">ยินยอมเผยแพร่ภาพ:</span>
                                    <span className={patient.media_consent ? 'text-green-600' : 'text-red-600'}>
                                        {patient.media_consent ? 'ยินยอม' : 'ไม่ยินยอม'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-center pb-2 pt-0">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-muted-foreground hover:text-foreground w-full"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="h-4 w-4 mr-2" />
                            ย่อข้อมูล
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            ดูข้อมูลเพิ่มเติม
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
