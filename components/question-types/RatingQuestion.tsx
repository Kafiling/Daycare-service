"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface RatingQuestionProps {
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

export default function RatingQuestion({
    question,
    value,
    onChange
}: RatingQuestionProps) {
    const maxRating = question.options?.maxRating || 5;
    const minRating = question.options?.minRating || 1;
    const labels = question.options?.labels || {};

    const ratings = Array.from(
        { length: maxRating - minRating + 1 },
        (_, i) => i + minRating
    );

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
                    <div className="flex flex-col space-y-3">
                        {ratings.map((rating) => (
                            <div key={rating} className="flex items-center space-x-3">
                                <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                                <Label htmlFor={`rating-${rating}`} className="cursor-pointer flex items-center gap-2">
                                    <div className="flex items-center">
                                        {Array.from({ length: rating }, (_, i) => (
                                            <Star
                                                key={i}
                                                className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                            />
                                        ))}
                                        {Array.from({ length: maxRating - rating }, (_, i) => (
                                            <Star
                                                key={i + rating}
                                                className="h-4 w-4 text-gray-300"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm">
                                        {rating} - {labels[rating] || `${rating} ดาว`}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
    );
}
