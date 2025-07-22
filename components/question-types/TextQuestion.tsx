"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface TextQuestionProps {
    question: {
        question_id: number;
        question_text: string;
        options?: any;
        is_required: boolean;
        helper_text?: string;
    };
    value: string;
    onChange: (value: string) => void;
}

export default function TextQuestion({
    question,
    value,
    onChange
}: TextQuestionProps) {
    const placeholder = question.options?.placeholder || 'พิมพ์คำตอบของคุณที่นี่...';
    const maxLength = question.options?.maxLength;

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
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className="min-h-[100px]"
                />
                {maxLength && (
                    <p className="text-xs text-muted-foreground mt-2">
                        {value.length}/{maxLength} ตัวอักษร
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
