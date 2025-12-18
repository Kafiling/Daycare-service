'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, Users } from 'lucide-react';
import Link from 'next/link';
import DeletePatientButton from './DeletePatientButton';
import type { PatientListItem } from './_actions/patientActions';
import { getAllPatients } from './_actions/patientActions';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface PatientTableProps {
  initialPatients: PatientListItem[];
}

export default function PatientTable({ initialPatients }: PatientTableProps) {
  const [patients, setPatients] = useState<PatientListItem[]>(initialPatients);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    startTransition(async () => {
      try {
        const results = await getAllPatients(query);
        setPatients(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = dayjs();
    const birthDate = dayjs(dateOfBirth);
    return today.diff(birthDate, 'year');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ค้นหาด้วย ID, ชื่อ, หรือเบอร์โทรศัพท์..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="gap-2">
          <Users className="h-4 w-4" />
          {patients.length} คน
        </Badge>
      </div>

      {/* Loading State */}
      {isPending && (
        <div className="text-center py-4 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          กำลังค้นหา...
        </div>
      )}

      {/* Table */}
      {!isPending && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">รหัสผู้ใช้บริการ</TableHead>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>อายุ</TableHead>
                <TableHead>เบอร์โทรศัพท์</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'ไม่พบผู้ใช้บริการที่ค้นหา' : 'ไม่มีข้อมูลผู้ใช้บริการ'}
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {patient.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {patient.full_name}
                    </TableCell>
                    <TableCell>
                      {patient.date_of_birth ? (
                        <span>{calculateAge(patient.date_of_birth)} ปี</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.phone_num || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {patient.email || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {dayjs(patient.created_at).format('D MMM BBBB')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/patient/${patient.id}/home`}>
                          <Button size="sm" variant="outline" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            ดูข้อมูล
                          </Button>
                        </Link>
                        <DeletePatientButton
                          patientId={patient.id}
                          patientName={patient.full_name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
