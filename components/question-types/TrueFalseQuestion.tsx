"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TrueFalseQuestionProps {
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

export default function TrueFalseQuestion({
    question,
    value,
    onChange
}: TrueFalseQuestionProps) {
    const trueLabel = question.options?.trueLabel || 'จริง';
    const falseLabel = question.options?.falseLabel || 'เท็จ';

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
                <RadioGroup value={value} onValueChange={onChange}>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="true" id="true-option" />
                            <Label htmlFor="true-option" className="cursor-pointer flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span>{trueLabel}</span>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <RadioGroupItem value="false" id="false-option" />
                            <Label htmlFor="false-option" className="cursor-pointer flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                <span>{falseLabel}</span>
                            </Label>
                        </div>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
    );
}
