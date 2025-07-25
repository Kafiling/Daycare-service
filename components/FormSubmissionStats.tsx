import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, TrendingUp, Users, Target } from 'lucide-react';

interface FormStatsProps {
    totalSubmissions: number;
    averageScore: number;
    resultDistribution: Record<string, number>;
    scoreRange: { min: number; max: number };
    maxPossibleScore?: number;
}

export function FormSubmissionStats({
    totalSubmissions,
    averageScore,
    resultDistribution,
    scoreRange,
    maxPossibleScore = 100
}: FormStatsProps) {
    const averagePercentage = maxPossibleScore > 0 ? (averageScore / maxPossibleScore) * 100 : 0;

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        if (percentage >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    const getBadgeVariant = (result: string, count: number) => {
        const percentage = (count / totalSubmissions) * 100;
        if (percentage > 50) return 'default';
        if (percentage > 25) return 'secondary';
        return 'outline';
    };

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">จำนวนการส่ง</p>
                                <p className="text-2xl font-bold">{totalSubmissions}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">คะแนนเฉลี่ย</p>
                                <p className={`text-2xl font-bold ${getScoreColor(averagePercentage)}`}>
                                    {averageScore}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-sm text-gray-600">คะแนนต่ำสุด</p>
                                <p className="text-2xl font-bold">{scoreRange.min}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">คะแนนสูงสุด</p>
                                <p className="text-2xl font-bold">{scoreRange.max}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Score Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        การกระจายผลการประเมิน
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {totalSubmissions > 0 ? (
                        <div className="space-y-4">
                            {Object.entries(resultDistribution).map(([result, count]) => {
                                const percentage = (count / totalSubmissions) * 100;
                                return (
                                    <div key={result} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getBadgeVariant(result, count)}>
                                                    {result}
                                                </Badge>
                                                <span className="text-sm text-gray-600">
                                                    {count} คน ({percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">ยังไม่มีข้อมูลการส่งฟอร์ม</p>
                    )}
                </CardContent>
            </Card>

            {/* Average Score Progress */}
            <Card>
                <CardHeader>
                    <CardTitle>ประสิทธิภาพโดยรวม</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>คะแนนเฉลี่ย</span>
                            <span className={getScoreColor(averagePercentage)}>
                                {averageScore} / {maxPossibleScore} ({averagePercentage.toFixed(1)}%)
                            </span>
                        </div>
                        <Progress value={averagePercentage} className="h-3" />
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                            {averagePercentage >= 80 && "ผลการประเมินโดยรวมอยู่ในระดับดีมาก"}
                            {averagePercentage >= 60 && averagePercentage < 80 && "ผลการประเมินโดยรวมอยู่ในระดับดี"}
                            {averagePercentage >= 40 && averagePercentage < 60 && "ผลการประเมินโดยรวมอยู่ในระดับปานกลาง"}
                            {averagePercentage < 40 && "ผลการประเมินโดยรวมต้องการการปรับปรุง"}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
