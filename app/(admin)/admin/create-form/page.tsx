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
import { QUESTION_TYPES, getQuestionTypeOptions, getDefaultOptions, type QuestionType } from '@/lib/question-types';


// TODO add ประเมิน

interface Question {
    id: string;
    question_text: string;
    question_type: QuestionType;
    is_required: boolean;
    helper_text: string;
    options: any;
}

const questionTypeOptions = getQuestionTypeOptions();

const initialQuestionState = {
    id: '',
    question_text: '',
    question_type: QUESTION_TYPES.TEXT,
    is_required: false,
    helper_text: '',
    options: {},
};

function QuestionEditor({ question, updateQuestion, removeQuestion }: { question: Question, updateQuestion: (id: string, question: Question) => void, removeQuestion: (id: string) => void }) {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateQuestion(question.id, { ...question, [name]: value });
    };

    const handleCheckboxChange = (checked: boolean) => {
        updateQuestion(question.id, { ...question, is_required: checked });
    };

    const handleTypeChange = (type: QuestionType) => {
        const newOptions = getDefaultOptions(type);
        updateQuestion(question.id, { ...question, question_type: type, options: newOptions });
    };

    const handleOptionChange = (optionName: string, value: any) => {
        updateQuestion(question.id, {
            ...question,
            options: { ...question.options, [optionName]: value },
        });
    };

    const handleMcqOptionChange = (index: number, field: 'text' | 'score', value: string | number) => {
        const newChoices = [...(question.options.choices || [])];
        if (field === 'text') {
            newChoices[index] = { ...newChoices[index], text: value as string };
        } else if (field === 'score') {
            newChoices[index] = { ...newChoices[index], score: Number(value) };
        }
        handleOptionChange('choices', newChoices);
    };

    const addMcqOption = () => {
        const newChoices = [...(question.options.choices || []), { text: '', score: 0 }];
        handleOptionChange('choices', newChoices);
    };

    const removeMcqOption = (index: number) => {
        const newChoices = [...(question.options.choices || [])];
        newChoices.splice(index, 1);
        handleOptionChange('choices', newChoices);
    };


    const renderOptions = () => {
        switch (question.question_type) {
            case QUESTION_TYPES.MULTIPLE_CHOICE:
                return (
                    <div className="space-y-2">

                        {(question.options.choices || []).map((choice: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Input
                                        value={typeof choice === 'string' ? choice : choice.text}
                                        onChange={(e) => handleMcqOptionChange(index, 'text', e.target.value)}
                                        placeholder={`ตัวเลือกที่ ${index + 1}`}
                                    />
                                </div>
                                <div className="w-24">
                                    <Input
                                        type="number"
                                        value={typeof choice === 'string' ? 0 : choice.score}
                                        onChange={(e) => handleMcqOptionChange(index, 'score', e.target.value)}
                                        placeholder="0"
                                        className="w-full"
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeMcqOption(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addMcqOption}>เพิ่มตัวเลือก</Button>
                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                                checked={question.options.allowOther || false}
                                onCheckedChange={(checked) => handleOptionChange('allowOther', checked)}
                            />
                            <Label className="text-sm">อนุญาตให้มีตัวเลือก "อื่นๆ"</Label>
                        </div>
                    </div>
                );
            case QUESTION_TYPES.TEXT:
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
                    </div>
                );
            case QUESTION_TYPES.RATING:
                return (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input type="number" placeholder="ค่าต่ำสุด (เช่น 1)" value={question.options.min || ''} onChange={e => handleOptionChange('min', e.target.value)} />
                            <Input type="number" placeholder="ค่าสูงสุด (เช่น 5)" value={question.options.max || ''} onChange={e => handleOptionChange('max', e.target.value)} />
                        </div>
                        <Input type="number" placeholder="ขั้น (ไม่บังคับ)" value={question.options.step || ''} onChange={e => handleOptionChange('step', e.target.value)} />
                        <div>
                            <Label className="text-sm">ตัวคูณคะแนน (คะแนน = ค่าที่เลือก × ตัวคูณ)</Label>
                            <Input 
                                type="number" 
                                placeholder="1" 
                                value={question.options.scoreMultiplier || 1} 
                                onChange={e => handleOptionChange('scoreMultiplier', Number(e.target.value))} 
                            />
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="ป้ายกำกับค่าต่ำสุด (ไม่บังคับ)" value={question.options.labels?.min || ''} onChange={e => handleOptionChange('labels', { ...(question.options.labels || {}), min: e.target.value })} />
                            <Input placeholder="ป้ายกำกับค่าสูงสุด (ไม่บังคับ)" value={question.options.labels?.max || ''} onChange={e => handleOptionChange('labels', { ...(question.options.labels || {}), max: e.target.value })} />
                        </div>
                    </div>
                );
            case QUESTION_TYPES.TRUE_FALSE:
                return (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <Label className="text-sm">ป้ายกำกับสำหรับ 'จริง'</Label>
                                <Input placeholder="เช่น ใช่, ถูกต้อง" value={question.options.trueLabel || ''} onChange={e => handleOptionChange('trueLabel', e.target.value)} />
                            </div>
                            <div className="w-24">
                                <Label className="text-sm">คะแนนเมื่อเลือก 'จริง'</Label>
                                <Input 
                                    type="number" 
                                    placeholder="0" 
                                    value={question.options.trueScore || 0} 
                                    onChange={e => handleOptionChange('trueScore', Number(e.target.value))} 
                                />
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <Label className="text-sm">ป้ายกำกับสำหรับ 'เท็จ'</Label>
                                <Input placeholder="เช่น ไม่ใช่, ไม่ถูกต้อง" value={question.options.falseLabel || ''} onChange={e => handleOptionChange('falseLabel', e.target.value)} />
                            </div>
                            <div className="w-24">
                                <Label className="text-sm">คะแนนเมื่อเลือก 'เท็จ'</Label>
                                <Input 
                                    type="number" 
                                    placeholder="0" 
                                    value={question.options.falseScore || 0} 
                                    onChange={e => handleOptionChange('falseScore', Number(e.target.value))} 
                                />
                            </div>
                        </div>
                    </div>
                );
            case QUESTION_TYPES.NUMBER:
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
                        <div>
                            <Label className="text-sm">ตัวคูณคะแนน (คะแนน = ตัวเลขที่ป้อน × ตัวคูณ)</Label>
                            <Input 
                                type="number" 
                                placeholder="1" 
                                value={question.options.scoreMultiplier || 1} 
                                onChange={e => handleOptionChange('scoreMultiplier', Number(e.target.value))} 
                            />
                        </div>
                        <Input placeholder="ข้อความตัวอย่าง" value={question.options.placeholder || ''} onChange={e => handleOptionChange('placeholder', e.target.value)} />
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
                                {questionTypeOptions.map(qt => (
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
    const [isSaving, setIsSaving] = useState(false);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                ...initialQuestionState,
                id: uuidv4(),
                question_type: QUESTION_TYPES.MULTIPLE_CHOICE,
                options: getDefaultOptions(QUESTION_TYPES.MULTIPLE_CHOICE),
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
