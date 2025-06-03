import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Calendar,
    Phone,
    Mail,
    MapPin,
    Weight,
    Ruler,
    Activity,
    User,
} from 'lucide-react';
import type { Patient } from '@/app/service/patient';

interface PatientInfoProps {
    patient: Patient;
}

export default function PatientInfo({ patient }: PatientInfoProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    ข้อมูลผู้ใช้บริการ
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">วันเกิด:</span>
                            <span>{formatDate(patient.date_of_birth)}</span>
                        </div>
                        {patient.phone_num && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">โทรศัพท์:</span>
                                <span>{patient.phone_num}</span>
                            </div>
                        )}
                        {patient.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">อีเมล:</span>
                                <span>{patient.email}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
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
                        {patient.weight && patient.height && (
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">BMI:</span>
                                <span>
                                    {(patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {(patient.address || patient.road || patient.sub_district || patient.district || patient.province || patient.postal_num) && (
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                <div>
                                    <span className="text-sm text-muted-foreground">ที่อยู่:</span>
                                    <div className="text-sm">
                                        {patient.address && <>{patient.address}<br /></>}
                                        {patient.road && <>{patient.road}<br /></>}
                                        {(patient.sub_district || patient.district) && (
                                            <>{patient.sub_district} {patient.district}<br /></>
                                        )}
                                        {(patient.province || patient.postal_num) && (
                                            <>{patient.province} {patient.postal_num}</>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
