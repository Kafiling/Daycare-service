import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, History, Calendar } from 'lucide-react';
import { getPatientById, getActiveForms, getCompletedSubmissions } from '@/app/service/patient';
import { getPatientGroupsForPatient, getUpcomingGroupEvents } from '@/app/service/group-assignment';
import { getTodayCheckIn, getCheckInHistory } from '@/app/service/checkin';
import PatientHeader from '@/components/patient/PatientHeader';
import PatientInfo from '@/components/patient/PatientInfo';
import AvailableSurveys from '@/components/patient/AvailableSurveys';
import CompletedSurveys from '@/components/patient/CompletedSurveys';
import SubmissionHistory from '@/components/patient/SubmissionHistory';
import { GroupEventsList } from '@/components/group/GroupEventsList';

interface PatientHomePageProps {
    params: Promise<{ id: string }>;
}

export default async function PatientHomePage({ params }: PatientHomePageProps) {
    try {
        const resolvedParams = await params;
        const patient = await getPatientById(resolvedParams.id);
        const availableForms = await getActiveForms();
        const completedSubmissions = await getCompletedSubmissions(resolvedParams.id);
        const todayCheckIn = await getTodayCheckIn(resolvedParams.id);
        const checkInHistory = await getCheckInHistory(resolvedParams.id);

        // Get patient groups and upcoming events
        const patientGroups = await getPatientGroupsForPatient(resolvedParams.id);
        const groupIds = patientGroups.map(group => group.id);

        // Get upcoming events and filter to only show events within the next month
        const allUpcomingEvents = await getUpcomingGroupEvents(groupIds);

        // Filter events to only include those within the next month (30 days)
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setDate(oneMonthFromNow.getDate() + 30);

        const upcomingEvents = allUpcomingEvents
            .filter(event => {
                const eventDate = new Date(event.event_datetime);
                return eventDate <= oneMonthFromNow;
            })
            .slice(0, 4); // Limit to maximum 4 events

        if (!patient) {
            return (
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600">ไม่พบข้อมูลผู้ใช้บริการ</h1>
                        <p className="text-muted-foreground mt-2">กรุณาตรวจสอบรหัสผู้ใช้บริการและลองใหม่อีกครั้ง</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl flex flex-col gap-y-4">
                {/* Patient Header */}
                <PatientHeader patient={patient} patientId={resolvedParams.id} patientGroups={patientGroups} />

                {/* Patient Information */}
                <PatientInfo patient={patient} todayCheckIn={todayCheckIn} history={checkInHistory} />

                {/* Upcoming Events */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            กิจกรรมที่กำลังจะมาถึง
                        </CardTitle>
                        <CardDescription>
                            กิจกรรมที่กำลังจะมาถึงในเดือนนี้ (แสดงสูงสุด 4 รายการ)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GroupEventsList
                            events={upcomingEvents}
                            title=""
                            description=""
                            emptyMessage="ไม่มีกิจกรรมที่กำลังจะมาถึงในกลุ่มของคุณ"
                            maxEvents={4}
                        />
                    </CardContent>
                </Card>

                {/* Patient Group Information */}

                {/* 
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            กลุ่มผู้ใช้บริการ
                        </CardTitle>
                        <CardDescription>
                            ข้อมูลกลุ่มที่ผู้ใช้บริการสังกัด
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {patientGroups.length > 0 ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {patientGroups
                                        .sort((a, b) => a.name.localeCompare(b.name, 'th'))
                                        .map(group => (
                                            <div key={group.id} className="p-4 bg-muted/50 rounded-lg">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: group.color || '#6B7280' }}
                                                    />
                                                    <p className="text-sm font-medium text-muted-foreground">ชื่อกลุ่ม</p>
                                                </div>
                                            <p className="text-lg font-semibold">{group.name}</p>
                                            {group.description && (
                                                <p className="text-sm mt-2 text-muted-foreground">{group.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                                <p className="text-lg text-muted-foreground">
                                    ยังไม่ได้กำหนดกลุ่มสำหรับผู้ใช้บริการนี้
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                */}

                {/* Form Submission History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            ประวัติการส่งแบบประเมิน
                        </CardTitle>
                        <CardDescription>
                            ประวัติการส่งแบบประเมินและผลการประเมินของผู้ใช้บริการ
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SubmissionHistory submissions={completedSubmissions} />
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
