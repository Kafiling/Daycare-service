import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Patient } from '@/app/service/patient';
import { PatientGroup } from '@/app/service/group-assignment';
import { Users } from 'lucide-react';

interface PatientHeaderProps {
    patient: Patient;
    patientId: string;
    patientGroups?: PatientGroup[];
}

export default function PatientHeader({ patient, patientId, patientGroups = [] }: PatientHeaderProps) {
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
    
    console.log('PatientHeader - patient:', patient);
    console.log('PatientHeader - patientGroups:', patientGroups);
    console.log('PatientHeader - patientGroups length:', patientGroups?.length);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <Avatar className="h-48 w-48">
                        <AvatarImage src={patient.profile_image_url || ''} />
                        <AvatarFallback className="text-6xl">
                            {patient.first_name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <CardTitle className="text-2xl">
                                {patient.title} {patient.first_name} {patient.last_name}
                            </CardTitle>
                            {patientGroups && patientGroups.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {[...patientGroups]
                                        .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                        .map(group => (
                                            <Badge 
                                                key={group.id} 
                                                style={{ backgroundColor: group.color || '#6B7280' }}
                                                className="font-normal text-white"
                                            >
                                                <Users className="h-3 w-3 mr-1" />
                                                {group.name}
                                            </Badge>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
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
