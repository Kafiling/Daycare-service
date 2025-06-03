"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface NumberQuestionProps {
    question: {
        id: number;
        question_text: string;
        options: any;
        is_required: boolean;
        helper_text?: string;
    };
    value: string;
    onChange: (value: string) => void;
}

export default function NumberQuestion({
    question,
    value,
    onChange
}: NumberQuestionProps) {
    const min = question.options?.min;
    const max = question.options?.max;
    const step = question.options?.step || 1;
    const unit = question.options?.unit || '';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {question.question_text}
                    {question.is_required && (
                        <Badge variant="destructive" className="text-xs">
                            จำเป็น
                        </Badge>
                    )}
                </CardTitle>
                {question.helper_text && (
                    <p className="text-sm text-muted-foreground">
                        {question.helper_text}
                    </p>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        min={min}
                        max={max}
                        step={step}
                        className="max-w-xs"
                    />
                    {unit && (
                        <span className="text-sm text-muted-foreground">{unit}</span>
                    )}
                </div>
                {(min !== undefined || max !== undefined) && (
                    <p className="text-xs text-muted-foreground mt-2">
                        {min !== undefined && max !== undefined
                            ? `ค่าระหว่าง ${min} - ${max}`
                            : min !== undefined
                                ? `ค่าต่ำสุด: ${min}`
                                : `ค่าสูงสุด: ${max}`}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
