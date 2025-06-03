import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Patient } from '@/app/service/patient';

interface PatientHeaderProps {
    patient: Patient;
    patientId: string;
}

export default function PatientHeader({ patient, patientId }: PatientHeaderProps) {
    const calculateAge = (birthDate: string) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

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
                <div className="flex items-center space-x-4">
                    <Avatar className="h-48 w-48">
                        <AvatarImage src={patient.image_url || ''} />
                        <AvatarFallback className="text-6xl">
                            {patient.first_name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-2xl">
                            {patient.title} {patient.first_name} {patient.last_name}
                        </CardTitle>
                        <CardDescription className="text-lg">
                            รหัสผู้ใช้บริการ: {patientId}
                        </CardDescription>
                        <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline">
                                อายุ {calculateAge(patient.date_of_birth)} ปี
                            </Badge>
                            <Badge variant="outline">
                                ลงทะเบียนเมื่อ {formatDate(patient.created_at)}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}
