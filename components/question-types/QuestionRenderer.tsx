"use client";

import React from 'react';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import TextQuestion from './TextQuestion';
import RatingQuestion from './RatingQuestion';
import TrueFalseQuestion from './TrueFalseQuestion';
import NumberQuestion from './NumberQuestion';

interface Question {
    id: number;
    form_id: number;
    question_text: string;
    question_type: string;
    options: any;
    is_required: boolean;
    helper_text?: string;
    created_at: string;
    updated_at: string;
}

interface QuestionRendererProps {
    question: Question;
    value: string;
    onChange: (value: string) => void;
}

export default function QuestionRenderer({
    question,
    value,
    onChange
}: QuestionRendererProps) {
    const renderQuestion = () => {
        switch (question.question_type) {
            case 'mcq':
            case 'multiple_choice':
                return (
                    <MultipleChoiceQuestion
                        question={question}
                        value={value}
                        onChange={onChange}
                    />
                );

            case 'text':
            case 'textbox':
            case 'textarea':
                return (
                    <TextQuestion
                        question={question}
                        value={value}
                        onChange={onChange}
                    />
                );

            case 'rating':
            case 'rate':
                return (
                    <RatingQuestion
                        question={question}
                        value={value}
                        onChange={onChange}
                    />
                );

            case 'true_false':
            case 'boolean':
                return (
                    <TrueFalseQuestion
                        question={question}
                        value={value}
                        onChange={onChange}
                    />
                );

            case 'number':
            case 'numeric':
                return (
                    <NumberQuestion
                        question={question}
                        value={value}
                        onChange={onChange}
                    />
                );

            default:
                return (
                    <div className="p-4 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            ประเภทคำถาม '{question.question_type}' ยังไม่รองรับ
                        </p>
                    </div>
                );
        }
    };

    return renderQuestion();
}
