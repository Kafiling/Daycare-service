"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Calendar,
    Phone,
    Mail,
    MapPin,
    Weight,
    Ruler,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Heart,
    Activity,
    Stethoscope
} from 'lucide-react';

// Mock data - will be replaced with Supabase data later
const mockPatientData = {
    id: "1234567890123",
    title: "นาย",
    first_name: "สมชาย",
    last_name: "ใจดี",
    date_of_birth: "1990-05-15",
    phone_num: "081-234-5678",
    email: "somchai@example.com",
    weight: 70.5,
    height: 175.0,
    address: {
        address: "123/45 หมู่บ้านสวนสน",
        road: "ถนนสุขุมวิท",
        sub_district: "บางนา",
        district: "บางนา",
        province: "กรุงเทพมหานคร",
        postal_num: "10260"
    },
    created_at: "2024-01-15T10:30:00Z",
    image_url: "https://cdn.vectorstock.com/i/1000v/87/50/man-male-young-person-icon-vector-10458750.jpg"
};

const mockAvailableSurveys = [
    {
        id: "survey-1",
        title: "แบบประเมินสุขภาพทั่วไป",
        description: "แบบประเมินสถานะสุขภาพโดยรวมของผู้ใช้บริการ",
        category: "สุขภาพทั่วไป",
        estimatedTime: 15,
        priority: "high",
        icon: Heart
    },
    {
        id: "survey-2",
        title: "แบบประเมินความเครียด",
        description: "ประเมินระดับความเครียดและสุขภาพจิต",
        category: "สุขภาพจิต",
        estimatedTime: 10,
        priority: "medium",
        icon: Activity
    },
    {
        id: "survey-3",
        title: "แบบประเมินความปลอดภัย",
        description: "ประเมินความเสี่ยงและความปลอดภัยในสภาพแวดล้อม",
        category: "ความปลอดภัย",
        estimatedTime: 12,
        priority: "medium",
        icon: AlertCircle
    },
    {
        id: "survey-4",
        title: "แบบประเมินกิจกรรมประจำวัน",
        description: "ประเมินความสามารถในการทำกิจกรรมประจำวัน",
        category: "กิจกรรมประจำวัน",
        estimatedTime: 20,
        priority: "low",
        icon: User
    }
];

const mockCompletedSurveys = [
    {
        id: "completed-1",
        title: "แบบประเมินสุขภาพเบื้องต้น",
        category: "สุขภาพทั่วไป",
        completedDate: "2024-12-01T14:30:00Z",
        completedBy: "พยาบาล สมหญิง ใจงาม",
        score: 85,
        status: "completed",
        notes: "ผลการประเมินอยู่ในเกณฑ์ปกติ"
    },
    {
        id: "completed-2",
        title: "แบบประเมินโภชนาการ",
        category: "โภชนาการ",
        completedDate: "2024-11-28T09:15:00Z",
        completedBy: "พยาบาล วิภา สุขใส",
        score: 78,
        status: "completed",
        notes: "แนะนำปรับเปลี่ยนการรับประทานอาหาร"
    },
    {
        id: "completed-3",
        title: "แบบประเมินการนอนหลับ",
        category: "การนอนหลับ",
        completedDate: "2024-11-25T16:45:00Z",
        completedBy: "พยาบาล มานี รักษ์ใจ",
        score: 92,
        status: "completed",
        notes: "คุณภาพการนอนหลับดีมาก"
    }
];

export default function PatientDashboard() {
    const params = useParams();
    const patientId = params.id as string;

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

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'default';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="container mx-auto p-6 space-y-6 flex flex-col gap-4">
            {/* Patient Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-48 w-48">
                            <AvatarImage src={mockPatientData.image_url || ''} />
                            <AvatarFallback className="text-6xl">
                                {mockPatientData.first_name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-2xl">
                                {mockPatientData.title} {mockPatientData.first_name} {mockPatientData.last_name}
                            </CardTitle>
                            <CardDescription className="text-lg">
                                รหัสผู้ใช้บริการ: {patientId}
                            </CardDescription>
                            <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">
                                    อายุ {calculateAge(mockPatientData.date_of_birth)} ปี
                                </Badge>
                                <Badge variant="outline">
                                    ลงทะเบียนเมื่อ {formatDate(mockPatientData.created_at)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Patient Information */}
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
                                <span>{formatDate(mockPatientData.date_of_birth)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">โทรศัพท์:</span>
                                <span>{mockPatientData.phone_num}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">อีเมล:</span>
                                <span>{mockPatientData.email}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Weight className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">น้ำหนัก:</span>
                                <span>{mockPatientData.weight} กก.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Ruler className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">ส่วนสูง:</span>
                                <span>{mockPatientData.height} ซม.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">BMI:</span>
                                <span>
                                    {(mockPatientData.weight / Math.pow(mockPatientData.height / 100, 2)).toFixed(1)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                <div>
                                    <span className="text-sm text-muted-foreground">ที่อยู่:</span>
                                    <div className="text-sm">
                                        {mockPatientData.address.address}<br />
                                        {mockPatientData.address.road}<br />
                                        {mockPatientData.address.sub_district} {mockPatientData.address.district}<br />
                                        {mockPatientData.address.province} {mockPatientData.address.postal_num}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Surveys Section */}
            <Tabs defaultValue="available" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="available">แบบประเมินที่ใช้ได้</TabsTrigger>
                    <TabsTrigger value="completed">แบบประเมินที่เสร็จแล้ว</TabsTrigger>
                </TabsList>

                {/* Available Surveys */}
                <TabsContent value="available" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                แบบประเมินที่พร้อมใช้งาน
                            </CardTitle>
                            <CardDescription>
                                แบบประเมินที่พยาบาลสามารถทำกับผู้ใช้บริการได้
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {mockAvailableSurveys.map((survey) => {
                                    const IconComponent = survey.icon;
                                    return (
                                        <Card key={survey.id} className="hover:shadow-md transition-shadow">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <IconComponent className="h-5 w-5 text-primary" />
                                                        <CardTitle className="text-lg">{survey.title}</CardTitle>
                                                    </div>
                                                    <Badge variant={getPriorityColor(survey.priority) as any}>
                                                        {survey.priority === 'high' ? 'สำคัญ' :
                                                            survey.priority === 'medium' ? 'ปกติ' : 'ไม่เร่งด่วน'}
                                                    </Badge>
                                                </div>
                                                <CardDescription>{survey.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {survey.estimatedTime} นาที
                                                        </div>
                                                        <Badge variant="outline">{survey.category}</Badge>
                                                    </div>
                                                    <Button size="sm">
                                                        เริ่มประเมิน
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Completed Surveys */}
                <TabsContent value="completed" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                แบบประเมินที่เสร็จสิ้นแล้ว
                            </CardTitle>
                            <CardDescription>
                                ประวัติการประเมินที่ได้ทำไปแล้ว
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockCompletedSurveys.map((survey, index) => (
                                    <div key={survey.id}>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Stethoscope className="h-4 w-4 text-primary" />
                                                            <h4 className="font-semibold">{survey.title}</h4>
                                                            <Badge variant="outline">{survey.category}</Badge>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-3 w-3" />
                                                                เสร็จสิ้นเมื่อ: {formatDateTime(survey.completedDate)}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-3 w-3" />
                                                                ดำเนินการโดย: {survey.completedBy}
                                                            </div>
                                                            {survey.notes && (
                                                                <div className="flex items-start gap-2 mt-2">
                                                                    <FileText className="h-3 w-3 mt-0.5" />
                                                                    <span>หมายเหตุ: {survey.notes}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-muted-foreground">คะแนน:</span>
                                                            <span className={`font-bold text-lg ${getScoreColor(survey.score)}`}>
                                                                {survey.score}/100
                                                            </span>
                                                        </div>
                                                        <Progress value={survey.score} className="w-20" />
                                                        <Button variant="outline" size="sm">
                                                            ดูรายละเอียด
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        {index < mockCompletedSurveys.length - 1 && <Separator className="my-4" />}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}