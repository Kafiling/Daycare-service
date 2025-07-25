import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Star, Hash, FileText } from 'lucide-react';

interface Answer {
    question_id: number;
    answer_value: any;
}

interface Question {
    question_id: number;
    question_text: string;
    question_type: string;
    options?: any;
    helper_text?: string;
}

interface PreviousAnswersProps {
    answers: Answer[];
    questions: Question[];
    showQuestionText?: boolean;
}

export function PreviousAnswers({ 
    answers, 
    questions, 
    showQuestionText = true 
}: PreviousAnswersProps) {
    const getQuestionById = (questionId: number) => {
        return questions.find(q => q.question_id === questionId);
    };

    const formatAnswer = (answer: Answer, question?: Question) => {
        if (!question) return JSON.stringify(answer.answer_value);

        switch (question.question_type) {
            case 'multipleChoice':
                if (typeof answer.answer_value === 'number') {
                    const choice = question.options?.choices?.[answer.answer_value];
                    return choice?.value || choice?.label || `ตัวเลือกที่ ${answer.answer_value + 1}`;
                }
                if (answer.answer_value === 'other') {
                    return 'อื่นๆ';
                }
                return String(answer.answer_value);

            case 'trueFalse':
                if (answer.answer_value === true) {
                    return question.options?.trueLabel || 'ใช่';
                } else if (answer.answer_value === false) {
                    return question.options?.falseLabel || 'ไม่ใช่';
                }
                return String(answer.answer_value);

            case 'rating':
                const rating = Number(answer.answer_value);
                const maxRating = Number(question.options?.max) || 5;
                return (
                    <div className="flex items-center gap-1">
                        <span>{rating}</span>
                        <div className="flex">
                            {Array.from({ length: maxRating }, (_, i) => (
                                <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                        i < rating 
                                            ? 'text-yellow-400 fill-yellow-400' 
                                            : 'text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'number':
                const unit = question.options?.unit || '';
                return `${answer.answer_value}${unit ? ` ${unit}` : ''}`;

            case 'text':
                return answer.answer_value || '-';

            default:
                return String(answer.answer_value);
        }
    };

    const getQuestionIcon = (questionType: string) => {
        switch (questionType) {
            case 'multipleChoice':
                return <Circle className="h-4 w-4 text-blue-500" />;
            case 'trueFalse':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'rating':
                return <Star className="h-4 w-4 text-yellow-500" />;
            case 'number':
                return <Hash className="h-4 w-4 text-purple-500" />;
            case 'text':
                return <FileText className="h-4 w-4 text-gray-500" />;
            default:
                return <Circle className="h-4 w-4 text-gray-400" />;
        }
    };

    if (!answers || answers.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-gray-500">
                    ไม่มีข้อมูลคำตอบที่บันทึกไว้
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">คำตอบที่บันทึกไว้</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {answers.map((answer) => {
                    const question = getQuestionById(answer.question_id);
                    return (
                        <div key={answer.question_id} className="border-b border-gray-100 pb-3 last:border-b-0">
                            {showQuestionText && question && (
                                <div className="flex items-start gap-2 mb-2">
                                    {getQuestionIcon(question.question_type)}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">
                                            คำถามที่ {question.question_id}: {question.question_text}
                                        </p>
                                        {question.helper_text && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {question.helper_text}
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {question.question_type === 'multipleChoice' && 'หลายตัวเลือก'}
                                        {question.question_type === 'trueFalse' && 'จริง/เท็จ'}
                                        {question.question_type === 'rating' && 'มาตรวัดระดับ'}
                                        {question.question_type === 'number' && 'ตัวเลข'}
                                        {question.question_type === 'text' && 'ข้อความ'}
                                    </Badge>
                                </div>
                            )}
                            <div className="ml-6">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600">คำตอบ:</span>
                                        <div className="text-sm text-gray-900">
                                            {formatAnswer(answer, question)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
