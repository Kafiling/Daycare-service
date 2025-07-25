import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EvaluationResultProps {
    totalScore: number;
    maxScore: number;
    evaluationResult?: string;
    evaluationDescription?: string;
    showProgress?: boolean;
}

export function EvaluationResult({
    totalScore,
    maxScore,
    evaluationResult,
    evaluationDescription,
    showProgress = true
}: EvaluationResultProps) {
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        if (percentage >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    const getBadgeVariant = (percentage: number) => {
        if (percentage >= 80) return 'default'; // Green
        if (percentage >= 60) return 'secondary'; // Yellow
        if (percentage >= 40) return 'outline'; // Orange
        return 'destructive'; // Red
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">ผลการประเมิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">คะแนนรวม</p>
                        <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                            {totalScore} / {maxScore}
                        </p>
                    </div>
                    {evaluationResult && (
                        <Badge variant={getBadgeVariant(percentage)} className="text-sm">
                            {evaluationResult}
                        </Badge>
                    )}
                </div>

                {showProgress && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>ความคืบหน้า</span>
                            <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                    </div>
                )}

                {evaluationDescription && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{evaluationDescription}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
