"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface MultipleChoiceQuestionProps {
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

export default function MultipleChoiceQuestion({
    question,
    value,
    onChange
}: MultipleChoiceQuestionProps) {
    const options = question.options?.choices || [];

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
                    {options.map((option: any, index: number) => {
                        const optionText = typeof option === 'string' ? option : option.text;
                        const isSelected = value === optionText;
                        return (
                            <div
                                key={index}
                                className={`flex items-center space-x-4 p-2 rounded-md transition-colors ${
                                    isSelected ? 'bg-primary/10' : ''
                                }`}
                            >
                                <RadioGroupItem value={optionText} id={`option-${index}`} />
                                <Label
                                    htmlFor={`option-${index}`}
                                    className="cursor-pointer text-lg flex-1"
                                >
                                    {optionText}
                                </Label>
                            </div>
                        );
                    })}
                </RadioGroup>
            </CardContent>
        </Card>
    );
}
