import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users } from 'lucide-react';
import { getPatientById, getActiveForms, getCompletedSubmissions } from '@/app/service/patient';
import { getPatientGroupAssignments } from '@/app/service/group-assignment';
import PatientHeader from '@/components/patient/PatientHeader';
import PatientInfo from '@/components/patient/PatientInfo';
import AvailableSurveys from '@/components/patient/AvailableSurveys';
import CompletedSurveys from '@/components/patient/CompletedSurveys';

interface PatientHomePageProps {
    params: Promise<{ id: string }>;
}

export default async function PatientHomePage({ params }: PatientHomePageProps) {
    try {
        const resolvedParams = await params;
        const patient = await getPatientById(resolvedParams.id);
        const availableForms = await getActiveForms();
        const completedSubmissions = await getCompletedSubmissions(resolvedParams.id);
        const groupAssignments = await getPatientGroupAssignments(resolvedParams.id, 1);

        if (!patient) {
            return (
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600">ไม่พบข้อมูลผู้ป่วย</h1>
                        <p className="text-muted-foreground mt-2">กรุณาตรวจสอบรหัสผู้ป่วยและลองใหม่อีกครั้ง</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl flex flex-col gap-y-4">
                {/* Patient Header */}
                <PatientHeader patient={patient} patientId={resolvedParams.id} />

                {/* Patient Information */}
                <PatientInfo patient={patient} />

                {/* Patient Group Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            กลุ่มผู้ใช้บริการ
                        </CardTitle>
                        <CardDescription>
                            ข้อมูลกลุ่มที่ผู้ป่วยสังกัด
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {groupAssignments.length > 0 && groupAssignments[0].new_group ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: groupAssignments[0].new_group.color || '#6B7280' }}
                                            />
                                            <p className="text-sm font-medium text-muted-foreground">ชื่อกลุ่ม</p>
                                        </div>
                                        <p className="text-lg font-semibold">{groupAssignments[0].new_group.name}</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm font-medium text-muted-foreground">วันที่เข้าร่วมกลุ่ม</p>
                                        <p className="text-lg font-semibold">
                                            {new Date(groupAssignments[0].created_at).toLocaleDateString('th-TH')}
                                        </p>
                                    </div>
                                </div>
                                {groupAssignments[0].new_group.description && (
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm font-medium text-muted-foreground">รายละเอียดกลุ่ม</p>
                                        <p className="text-sm mt-1">{groupAssignments[0].new_group.description}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                                <p className="text-lg text-muted-foreground">
                                    ยังไม่ได้กำหนดกลุ่มสำหรับผู้ป่วยนี้
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Forms and Surveys */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            แบบประเมินและแบบสำรวจ
                        </CardTitle>
                        <CardDescription>
                            แบบประเมินที่พร้อมใช้งานและผลการประเมินที่เสร็จสิ้นแล้ว
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="available" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="available">
                                    แบบประเมินที่พร้อมใช้งาน ({availableForms.length})
                                </TabsTrigger>
                                <TabsTrigger value="completed">
                                    เสร็จสิ้นแล้ว ({completedSubmissions.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="available" className="mt-6">
                                <AvailableSurveys patientId={resolvedParams.id} forms={availableForms} />
                            </TabsContent>

                            <TabsContent value="completed" className="mt-6">
                                <CompletedSurveys submissions={completedSubmissions} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error) {
        console.error('Error loading patient data:', error);
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">เกิดข้อผิดพลาด</h1>
                    <p className="text-muted-foreground mt-2">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
                </div>
            </div>
        );
    }
}
