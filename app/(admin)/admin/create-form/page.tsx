"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { createForm } from './action';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';


// TODO add ประเมิน

interface Question {
    id: string;
    question_text: string;
    question_type: string;
    is_required: boolean;
    helper_text: string;
    options: any;
    evaluation_scores: any;
}

interface EvaluationThreshold {
    id: string;
    minScore: number;
    maxScore: number;
    result: string;
    description: string;
}

// Based on your readme.md spec
const questionTypes = [
    { value: 'multipleChoice', label: 'หลายตัวเลือก' },
    { value: 'text', label: 'ป้อนข้อความ' },
    { value: 'rating', label: 'มาตรวัดระดับ' },
    { value: 'trueFalse', label: 'จริง/เท็จ' },
    { value: 'number', label: 'ป้อนตัวเลข' },
];

const initialQuestionState = {
    id: '',
    question_text: '',
    question_type: 'text',
    is_required: false,
    helper_text: '',
    options: {},
    evaluation_scores: {},
};

function QuestionEditor({ question, updateQuestion, removeQuestion }: { question: Question, updateQuestion: (id: string, question: Question) => void, removeQuestion: (id: string) => void }) {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateQuestion(question.id, { ...question, [name]: value });
    };

    const handleCheckboxChange = (checked: boolean) => {
        updateQuestion(question.id, { ...question, is_required: checked });
    };

    const handleTypeChange = (type: string) => {
        let newOptions = {};
        let newEvaluationScores = {};
        
        if (type === 'multipleChoice') {
            newOptions = {
                choices: Array.from({ length: 4 }, () => ({ value: '', label: '' })),
            };
            newEvaluationScores = {
                choices: Array.from({ length: 4 }, () => 0),
            };
        } else if (type === 'trueFalse') {
            newOptions = {
                trueLabel: 'ใช่',
                falseLabel: 'ไม่ใช่',
            };
            newEvaluationScores = {
                trueScore: 0,
                falseScore: 0,
            };
        } else if (type === 'rating') {
            newEvaluationScores = {
                scorePerPoint: 1, // Score multiplier per rating point
            };
        } else if (type === 'number') {
            newEvaluationScores = {
                scoreCalculation: 'direct', // 'direct' or 'range'
                ranges: [], // For range-based scoring
            };
        } else if (type === 'text') {
            newEvaluationScores = {
                baseScore: 0, // Fixed score for text questions
            };
        }
        
        updateQuestion(question.id, { 
            ...question, 
            question_type: type, 
            options: newOptions,
            evaluation_scores: newEvaluationScores 
        });
    };

    const handleOptionChange = (optionName: string, value: any) => {
        updateQuestion(question.id, {
            ...question,
            options: { ...question.options, [optionName]: value },
        });
    };

    const handleMcqOptionChange = (index: number, value: string) => {
        const newChoices = [...(question.options.choices || [])];
        newChoices[index] = { value: value, label: value };
        handleOptionChange('choices', newChoices);
    };

    const handleMcqScoreChange = (index: number, score: number) => {
        const newScores = [...(question.evaluation_scores.choices || [])];
        newScores[index] = score;
        updateQuestion(question.id, {
            ...question,
            evaluation_scores: { ...question.evaluation_scores, choices: newScores },
        });
    };

    const handleEvaluationScoreChange = (scoreName: string, value: any) => {
        updateQuestion(question.id, {
            ...question,
            evaluation_scores: { ...question.evaluation_scores, [scoreName]: value },
        });
    };

    const addMcqOption = () => {
        const newChoices = [...(question.options.choices || []), { value: '', label: '' }];
        const newScores = [...(question.evaluation_scores.choices || []), 0];
        handleOptionChange('choices', newChoices);
        updateQuestion(question.id, {
            ...question,
            evaluation_scores: { ...question.evaluation_scores, choices: newScores },
        });
    };

    const removeMcqOption = (index: number) => {
        const newChoices = [...(question.options.choices || [])];
        const newScores = [...(question.evaluation_scores.choices || [])];
        newChoices.splice(index, 1);
        newScores.splice(index, 1);
        handleOptionChange('choices', newChoices);
        updateQuestion(question.id, {
            ...question,
            evaluation_scores: { ...question.evaluation_scores, choices: newScores },
        });
    };


    const renderOptions = () => {
        switch (question.question_type) {
            case 'multipleChoice':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">ตัวเลือกและคะแนน</Label>
                            {(question.options.choices || []).map((choice: { value: string }, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={choice.value}
                                        onChange={(e) => handleMcqOptionChange(index, e.target.value)}
                                        placeholder={`ตัวเลือกที่ ${index + 1}`}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        value={question.evaluation_scores.choices?.[index] || 0}
                                        onChange={(e) => handleMcqScoreChange(index, parseInt(e.target.value) || 0)}
                                        placeholder="คะแนน"
                                        className="w-20"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removeMcqOption(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addMcqOption}>เพิ่มตัวเลือก</Button>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                                checked={question.options.allowOther || false}
                                onCheckedChange={(checked) => handleOptionChange('allowOther', checked)}
                            />
                            <Label className="text-sm">อนุญาตให้มีตัวเลือก "อื่นๆ"</Label>
                            {question.options.allowOther && (
                                <Input
                                    type="number"
                                    value={question.evaluation_scores.otherScore || 0}
                                    onChange={(e) => handleEvaluationScoreChange('otherScore', parseInt(e.target.value) || 0)}
                                    placeholder="คะแนนสำหรับ 'อื่นๆ'"
                                    className="w-32 ml-2"
                                />
                            )}
                        </div>
                    </div>
                );
            case 'text':
                return (
                    <div className="space-y-2">
                        <Input placeholder="ข้อความตัวอย่าง" value={question.options.placeholder || ''} onChange={e => handleOptionChange('placeholder', e.target.value)} />
                        <Input type="number" placeholder="ความยาวสูงสุด" value={question.options.maxLength || ''} onChange={e => handleOptionChange('maxLength', e.target.value)} />
                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                                checked={question.options.multiline || false}
                                onCheckedChange={(checked) => handleOptionChange('multiline', checked)}
                            />
                            <Label className="text-sm">พื้นที่ข้อความหลายบรรทัด (Textarea)</Label>
                        </div>
                        <div className="border-t pt-2">
                            <Label className="text-sm font-medium">การประเมิน</Label>
                            <Input
                                type="number"
                                placeholder="คะแนนพื้นฐาน"
                                value={question.evaluation_scores.baseScore || 0}
                                onChange={(e) => handleEvaluationScoreChange('baseScore', parseInt(e.target.value) || 0)}
                                className="mt-1"
                            />
                        </div>
                    </div>
                );
            case 'rating':
                return (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input type="number" placeholder="ค่าต่ำสุด (เช่น 1)" value={question.options.min || ''} onChange={e => handleOptionChange('min', e.target.value)} />
                            <Input type="number" placeholder="ค่าสูงสุด (เช่น 5)" value={question.options.max || ''} onChange={e => handleOptionChange('max', e.target.value)} />
                        </div>
                        <Input type="number" placeholder="ขั้น (ไม่บังคับ)" value={question.options.step || ''} onChange={e => handleOptionChange('step', e.target.value)} />
                        <div className="flex gap-2">
                            <Input placeholder="ป้ายกำกับค่าต่ำสุด (ไม่บังคับ)" value={question.options.labels?.min || ''} onChange={e => handleOptionChange('labels', { ...(question.options.labels || {}), min: e.target.value })} />
                            <Input placeholder="ป้ายกำกับค่าสูงสุด (ไม่บังคับ)" value={question.options.labels?.max || ''} onChange={e => handleOptionChange('labels', { ...(question.options.labels || {}), max: e.target.value })} />
                        </div>
                        <div className="border-t pt-2">
                            <Label className="text-sm font-medium">การประเมิน</Label>
                            <Input
                                type="number"
                                placeholder="คะแนนต่อระดับ (เช่น หากเลือก 3 จะได้ 3 x ค่านี้)"
                                value={question.evaluation_scores.scorePerPoint || 1}
                                onChange={(e) => handleEvaluationScoreChange('scorePerPoint', parseInt(e.target.value) || 1)}
                                className="mt-1"
                            />
                        </div>
                    </div>
                );
            case 'trueFalse':
                return (
                    <div className="space-y-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2 items-center">
                                <Input placeholder="ป้ายกำกับสำหรับ 'จริง'" value={question.options.trueLabel || ''} onChange={e => handleOptionChange('trueLabel', e.target.value)} className="flex-1" />
                                <Input
                                    type="number"
                                    placeholder="คะแนน"
                                    value={question.evaluation_scores.trueScore || 0}
                                    onChange={(e) => handleEvaluationScoreChange('trueScore', parseInt(e.target.value) || 0)}
                                    className="w-20"
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <Input placeholder="ป้ายกำกับสำหรับ 'เท็จ'" value={question.options.falseLabel || ''} onChange={e => handleOptionChange('falseLabel', e.target.value)} className="flex-1" />
                                <Input
                                    type="number"
                                    placeholder="คะแนน"
                                    value={question.evaluation_scores.falseScore || 0}
                                    onChange={(e) => handleEvaluationScoreChange('falseScore', parseInt(e.target.value) || 0)}
                                    className="w-20"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'number':
                return (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input type="number" placeholder="ค่าต่ำสุด" value={question.options.min || ''} onChange={e => handleOptionChange('min', e.target.value)} />
                            <Input type="number" placeholder="ค่าสูงสุด" value={question.options.max || ''} onChange={e => handleOptionChange('max', e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <Input type="number" placeholder="ขั้น (ไม่บังคับ)" value={question.options.step || ''} onChange={e => handleOptionChange('step', e.target.value)} />
                            <Input placeholder="หน่วย (เช่น กก., ซม.)" value={question.options.unit || ''} onChange={e => handleOptionChange('unit', e.target.value)} />
                        </div>
                        <Input placeholder="ข้อความตัวอย่าง" value={question.options.placeholder || ''} onChange={e => handleOptionChange('placeholder', e.target.value)} />
                        <div className="border-t pt-2">
                            <Label className="text-sm font-medium">การประเมิน</Label>
                            <div className="flex gap-2 mt-1">
                                <Select 
                                    value={question.evaluation_scores.scoreCalculation || 'direct'} 
                                    onValueChange={(value) => handleEvaluationScoreChange('scoreCalculation', value)}
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="direct">ใช้ค่าตรง</SelectItem>
                                        <SelectItem value="fixed">คะแนนคงที่</SelectItem>
                                    </SelectContent>
                                </Select>
                                {question.evaluation_scores.scoreCalculation === 'fixed' && (
                                    <Input
                                        type="number"
                                        placeholder="คะแนนคงที่"
                                        value={question.evaluation_scores.fixedScore || 0}
                                        onChange={(e) => handleEvaluationScoreChange('fixedScore', parseInt(e.target.value) || 0)}
                                        className="w-32"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Card>
            <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                        <Input
                            name="question_text"
                            value={question.question_text}
                            onChange={handleInputChange}
                            placeholder="พิมพ์คำถามของคุณที่นี่..."
                            className="text-lg font-semibold  border-none shadow-none focus-visible:ring-0 p-0 resize-none"
                        />
                        <Input
                            name="helper_text"
                            value={question.helper_text}
                            onChange={handleInputChange}
                            placeholder="เพิ่มคำแนะนำหรือแนวทางที่เป็นประโยชน์ (ไม่บังคับ)..."
                            className="text-base border-none shadow-none focus-visible:ring-0 p-0"
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label className="pb-2 text-base">ประเภทคำถาม</Label>
                        <Select value={question.question_type} onValueChange={handleTypeChange}>
                            <SelectTrigger className="text-base">
                                <SelectValue placeholder="เลือกประเภทคำถาม" />
                            </SelectTrigger>
                            <SelectContent>
                                {questionTypes.map(qt => (
                                    <SelectItem key={qt.value} value={qt.value}>{qt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="pb-2 text-base">ตัวเลือก</Label>
                        {renderOptions()}
                    </div>
                </div>

                <div className="flex items-center pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <Checkbox id={`required-${question.id}`} checked={question.is_required} onCheckedChange={handleCheckboxChange} />
                        <Label htmlFor={`required-${question.id}`} className="pb-2 text-base">จำเป็น</Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


export default function CreateFormPage() {
    const router = useRouter();
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [evaluationThresholds, setEvaluationThresholds] = useState<EvaluationThreshold[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const addEvaluationThreshold = () => {
        setEvaluationThresholds([
            ...evaluationThresholds,
            {
                id: uuidv4(),
                minScore: 0,
                maxScore: 0,
                result: '',
                description: '',
            },
        ]);
    };

    const updateEvaluationThreshold = (id: string, updatedThreshold: EvaluationThreshold) => {
        setEvaluationThresholds(evaluationThresholds.map(t => t.id === id ? updatedThreshold : t));
    };

    const removeEvaluationThreshold = (id: string) => {
        setEvaluationThresholds(evaluationThresholds.filter(t => t.id !== id));
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                ...initialQuestionState,
                id: uuidv4(),
                question_type: 'multipleChoice',
                options: {
                    choices: Array.from({ length: 4 }, () => ({ value: '', label: '' })),
                },
                evaluation_scores: {
                    choices: Array.from({ length: 4 }, () => 0),
                },
            },
        ]);
    };

    const updateQuestion = (id: string, updatedQuestion: Question) => {
        setQuestions(questions.map(q => q.id === id ? updatedQuestion : q));
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const formPayload = {
            title: formTitle,
            description: formDescription,
            questions: questions,
            evaluation_thresholds: evaluationThresholds,
        };

        try {
            const result = await createForm(formPayload);
            if (result.error) {
                toast.error("Failed to save form", {
                    description: result.error,
                });
            } else {
                toast.success("Form saved successfully!");
                // Optionally redirect or clear the form
                router.push('/admin'); // or some other relevant page
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-8">
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">สร้างฟอร์มใหม่</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <Label htmlFor="form-title" className="pb-2 text-lg">ชื่อฟอร์ม</Label>
                                <Input id="form-title" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="เช่น, ตรวจสุขภาพรายวัน" className="text-base" />
                            </div>
                            <div>
                                <Label htmlFor="form-description" className="pb-2 text-lg">คำอธิบายฟอร์ม</Label>
                                <Textarea id="form-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="คำอธิบายสั้นๆ เกี่ยวกับวัตถุประสงค์ของฟอร์ม" className="text-base" />
                            </div>
                        </CardContent>
                    </Card>

                    {questions.map((q) => (
                        <QuestionEditor
                            key={q.id}
                            question={q}
                            updateQuestion={updateQuestion}
                            removeQuestion={removeQuestion}
                        />
                    ))}

                    <div className="flex justify-center">
                        <Button variant="outline" onClick={addQuestion} className="w-full md:w-auto text-lg p-6">
                            <PlusCircle className="h-5 w-5 mr-2" />
                            เพิ่มคำถาม
                        </Button>
                    </div>

                    {/* Evaluation Thresholds Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">เกณฑ์การประเมินผล</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {evaluationThresholds.map((threshold) => (
                                <div key={threshold.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Input
                                        type="number"
                                        placeholder="คะแนนต่ำสุด"
                                        value={threshold.minScore}
                                        onChange={(e) => updateEvaluationThreshold(threshold.id, {
                                            ...threshold,
                                            minScore: parseInt(e.target.value) || 0
                                        })}
                                        className="w-32"
                                    />
                                    <span className="text-gray-500">ถึง</span>
                                    <Input
                                        type="number"
                                        placeholder="คะแนนสูงสุด"
                                        value={threshold.maxScore}
                                        onChange={(e) => updateEvaluationThreshold(threshold.id, {
                                            ...threshold,
                                            maxScore: parseInt(e.target.value) || 0
                                        })}
                                        className="w-32"
                                    />
                                    <Input
                                        placeholder="ผลการประเมิน (เช่น ดีมาก, ดี, ปานกลาง)"
                                        value={threshold.result}
                                        onChange={(e) => updateEvaluationThreshold(threshold.id, {
                                            ...threshold,
                                            result: e.target.value
                                        })}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="คำอธิบาย (ไม่บังคับ)"
                                        value={threshold.description}
                                        onChange={(e) => updateEvaluationThreshold(threshold.id, {
                                            ...threshold,
                                            description: e.target.value
                                        })}
                                        className="flex-1"
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeEvaluationThreshold(threshold.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" onClick={addEvaluationThreshold} className="w-full">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                เพิ่มเกณฑ์การประเมิน
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} size="lg" className="text-lg" disabled={isSaving}>
                            {isSaving ? "กำลังบันทึก..." : "บันทึกฟอร์ม"}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
