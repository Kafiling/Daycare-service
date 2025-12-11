'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Zap } from 'lucide-react';
import { PatientGroup } from '@/app/service/group-assignment';

interface PatientCardProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    groups: PatientGroup[];
  };
  onManualAssign: (patientId: string) => void;
  isLoading: boolean;
}

export function PatientCard({ patient, onManualAssign, isLoading }: PatientCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
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
            onClick={() => onManualAssign(patient.id)}
            disabled={isLoading}
          >
            <Zap className="h-4 w-4 mr-1" />
            ประเมินกลุ่มใหม่
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
