import { notFound } from 'next/navigation';
import { getPatientById } from '@/app/service/patient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin, Weight, Ruler, Activity, Heart, Users } from 'lucide-react';
import Link from 'next/link';

interface AdminPatientViewProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminPatientView({ params }: AdminPatientViewProps) {
  const { id: patientId } = await params;

  const patient = await getPatientById(patientId);
  if (!patient) {
    notFound();
  }

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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin/manage-patients">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้าจัดการผู้ใช้บริการ
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <User className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">ข้อมูลผู้ใช้บริการ</h1>
          <Badge variant="secondary">ดูอย่างเดียว</Badge>
        </div>
        <p className="text-muted-foreground">
          แสดงข้อมูลผู้ใช้บริการแบบอ่านอย่างเดียว (สำหรับผู้ดูแลระบบ)
        </p>
      </div>

      {/* Patient Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              ข้อมูลส่วนตัว
            </CardTitle>
            <Badge variant="outline" className="font-mono">
              ID: {patient.id}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground">ข้อมูลทั่วไป</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">ชื่อ-นามสกุล</div>
                  <div className="font-medium">{patient.full_name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">อายุ: </span>
                    <span className="font-medium">{calculateAge(patient.date_of_birth)} ปี</span>
                    <span className="text-xs text-muted-foreground ml-2">({formatDate(patient.date_of_birth)})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">เพศ:</span>
                  <span>{patient.gender === 'male' ? 'ชาย' : patient.gender === 'female' ? 'หญิง' : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">โทรศัพท์:</span>
                  <span>{patient.phone_num || '-'}</span>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">อีเมล:</span>
                    <span>{patient.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">ผู้ดูแล:</span>
                  <span>{patient.caregiver_name || '-'}</span>
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground">ข้อมูลสุขภาพ</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">น้ำหนัก:</span>
                  <span>{patient.weight ? `${patient.weight} กก.` : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">ส่วนสูง:</span>
                  <span>{patient.height ? `${patient.height} ซม.` : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">BMI:</span>
                  <span className={patient.weight && patient.height ? `font-medium ${
                    (patient.weight / Math.pow(patient.height / 100, 2)) > 25 ? 'text-orange-500' : 'text-green-600'
                  }` : ''}>
                    {patient.weight && patient.height 
                      ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)
                      : '-'
                    }
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">โรคประจำตัว:</span>
                  </div>
                  {patient.underlying_diseases && patient.underlying_diseases.length > 0 && !patient.underlying_diseases.includes('none') ? (
                    <div className="flex flex-wrap gap-1 ml-6">
                      {patient.underlying_diseases.map((disease, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {getDiseaseLabel(disease)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="ml-6">ไม่มี</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground">ประวัติการหกล้ม: </span>
                    <span className={patient.fall_history ? 'text-orange-600 font-medium' : ''}>
                      {patient.fall_history ? 'เคย' : 'ไม่เคย'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">ประวัติการเข้ารักษา: </span>
                    <span className={patient.hospitalization_history ? 'text-blue-600 font-medium' : ''}>
                      {patient.hospitalization_history ? 'เคย (ใน 1 ปี)' : 'ไม่เคย'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground">ข้อมูลเพิ่มเติม</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">สถานภาพสมรส</div>
                  <div>{
                    patient.marital_status === 'single' ? 'โสด' :
                    patient.marital_status === 'married' ? 'สมรส' :
                    patient.marital_status === 'divorced' ? 'หย่า' :
                    patient.marital_status === 'widowed' ? 'หม้าย' : '-'
                  }</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">การศึกษา</div>
                  <div>{
                    patient.education_level === 'none' ? 'ไม่ได้เรียน' :
                    patient.education_level === 'primary' ? 'ประถมศึกษา' :
                    patient.education_level === 'lower_secondary' ? 'ม.ต้น' :
                    patient.education_level === 'upper_secondary' ? 'ม.ปลาย' :
                    patient.education_level === 'bachelor_plus' ? 'ปริญญาตรีขึ้นไป' : '-'
                  }</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">การเดินทาง</div>
                  <div>{
                    patient.transportation === 'self_drive' ? 'ขับรถมาเอง' :
                    patient.transportation === 'relative' ? 'ญาติมาส่ง' :
                    patient.transportation === 'bts' ? 'BTS' :
                    patient.transportation || '-'
                  }</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">ที่จอดรถ</div>
                  <div>{patient.parking_requirement ? 'ต้องการ' : 'ไม่ต้องการ'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">ยินยอมเผยแพร่ภาพ</div>
                  <div className={patient.media_consent ? 'text-green-600' : 'text-red-600'}>
                    {patient.media_consent ? 'ยินยอม' : 'ไม่ยินยอม'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          {patient.address && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                ที่อยู่
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
          )}

          {/* Metadata */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div>
                <span>สร้างเมื่อ: </span>
                <span className="font-medium">{formatDate(patient.created_at)}</span>
              </div>
              <div>
                <span>อัปเดตล่าสุด: </span>
                <span className="font-medium">{formatDate(patient.updated_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-blue-600">ℹ️</div>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">หน้านี้เป็นหน้าดูข้อมูลอย่างเดียว</p>
              <p>
                หากต้องการแก้ไขข้อมูล กรุณาเข้าสู่ระบบในฐานะพนักงานและเข้าถึงข้อมูลผู้ใช้บริการผ่านหน้าหลัก
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
