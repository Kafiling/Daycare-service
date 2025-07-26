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
            const scoreValue = value === '' ? 0 : Number(value);
            newChoices[index] = { ...newChoices[index], score: scoreValue };
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
                                        placeholder={`ตัวเลือกที่ ${index + 1} *`}
                                        className={`${!(typeof choice === 'string' ? choice : choice.text)?.trim() ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                    />
                                </div>
                                <div className="w-24">
                                    <Input
                                        type="number"
                                        value={typeof choice === 'string' ? '' : (choice.score || '')}
                                        onChange={(e) => handleMcqOptionChange(index, 'score', e.target.value)}
                                        placeholder="0"
                                        className="w-full"
                                        onWheel={(e) => e.currentTarget.blur()}
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
                        <Input 
                            type="number" 
                            placeholder="ความยาวสูงสุด" 
                            value={question.options.maxLength || ''} 
                            onChange={e => handleOptionChange('maxLength', e.target.value)} 
                            onWheel={(e) => e.currentTarget.blur()}
                        />
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
                            <Input 
                                type="number" 
                                placeholder="ค่าต่ำสุด (เช่น 1) *" 
                                value={question.options.min || ''} 
                                onChange={e => handleOptionChange('min', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                                className={`${!question.options.min ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                            />
                            <Input 
                                type="number" 
                                placeholder="ค่าสูงสุด (เช่น 5) *" 
                                value={question.options.max || ''} 
                                onChange={e => handleOptionChange('max', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                                className={`${!question.options.max ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                            />
                        </div>
                        <Input 
                            type="number" 
                            placeholder="ขั้น (ไม่บังคับ)" 
                            value={question.options.step || ''} 
                            onChange={e => handleOptionChange('step', e.target.value)} 
                            onWheel={(e) => e.currentTarget.blur()}
                        />
                        <div>
                            <Label className="text-sm">ตัวคูณคะแนน (คะแนน = ค่าที่เลือก × ตัวคูณ)</Label>
                            <Input 
                                type="number" 
                                placeholder="1" 
                                value={question.options.scoreMultiplier || ''} 
                                onChange={e => handleOptionChange('scoreMultiplier', Number(e.target.value))} 
                                onWheel={(e) => e.currentTarget.blur()}
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
                                    value={question.options.trueScore || ''} 
                                    onChange={e => handleOptionChange('trueScore', Number(e.target.value))} 
                                    onWheel={(e) => e.currentTarget.blur()}
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
                                    value={question.options.falseScore || ''} 
                                    onChange={e => handleOptionChange('falseScore', Number(e.target.value))} 
                                    onWheel={(e) => e.currentTarget.blur()}
                                />
                            </div>
                        </div>
                    </div>
                );
            case QUESTION_TYPES.NUMBER:
                return (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input 
                                type="number" 
                                placeholder="ค่าต่ำสุด" 
                                value={question.options.min || ''} 
                                onChange={e => handleOptionChange('min', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                            <Input 
                                type="number" 
                                placeholder="ค่าสูงสุด" 
                                value={question.options.max || ''} 
                                onChange={e => handleOptionChange('max', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Input 
                                type="number" 
                                placeholder="ขั้น (ไม่บังคับ)" 
                                value={question.options.step || ''} 
                                onChange={e => handleOptionChange('step', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                            <Input placeholder="หน่วย (เช่น กก., ซม.)" value={question.options.unit || ''} onChange={e => handleOptionChange('unit', e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-sm">ตัวคูณคะแนน (คะแนน = ตัวเลขที่ป้อน × ตัวคูณ)</Label>
                            <Input 
                                type="number" 
                                placeholder="1" 
                                value={question.options.scoreMultiplier || ''} 
                                onChange={e => handleOptionChange('scoreMultiplier', Number(e.target.value))} 
                                onWheel={(e) => e.currentTarget.blur()}
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
                            placeholder="พิมพ์คำถามของคุณที่นี่... *"
                            className={`text-lg font-semibold border-none shadow-none focus-visible:ring-0 p-0 resize-none ${!question.question_text.trim() ? 'placeholder:text-red-400' : ''}`}
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
    const [evaluationThresholds, setEvaluationThresholds] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Check if form is valid for saving
    const isFormValid = () => {
        return validateForm().length === 0;
    };

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

    const addThreshold = () => {
        setEvaluationThresholds([
            ...evaluationThresholds,
            { minScore: '', maxScore: '', result: '', description: '' }
        ]);
    };

    const updateThreshold = (index: number, field: string, value: any) => {
        const newThresholds = [...evaluationThresholds];
        newThresholds[index] = { ...newThresholds[index], [field]: value };
        setEvaluationThresholds(newThresholds);
    };

    const removeThreshold = (index: number) => {
        setEvaluationThresholds(evaluationThresholds.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const errors: string[] = [];

        // Check form title
        if (!formTitle.trim()) {
            errors.push("ชื่อฟอร์มเป็นข้อมูลที่จำเป็น");
        }

        // Check form description
        if (!formDescription.trim()) {
            errors.push("คำอธิบายฟอร์มเป็นข้อมูลที่จำเป็น");
        }

        // Check if there are questions
        if (questions.length === 0) {
            errors.push("ต้องมีคำถามอย่างน้อย 1 คำถาม");
        }

        // Validate each question
        questions.forEach((question, index) => {
            if (!question.question_text.trim()) {
                errors.push(`คำถามที่ ${index + 1}: ข้อความคำถามเป็นข้อมูลที่จำเป็น`);
            }

            // Validate question-specific options
            switch (question.question_type) {
                case QUESTION_TYPES.MULTIPLE_CHOICE:
                    if (!question.options.choices || question.options.choices.length === 0) {
                        errors.push(`คำถามที่ ${index + 1}: ต้องมีตัวเลือกอย่างน้อย 1 ตัวเลือก`);
                    } else {
                        question.options.choices.forEach((choice: any, choiceIndex: number) => {
                            if (!choice.text || !choice.text.trim()) {
                                errors.push(`คำถามที่ ${index + 1}: ตัวเลือกที่ ${choiceIndex + 1} ต้องมีข้อความ`);
                            }
                        });
                    }
                    break;
                case QUESTION_TYPES.RATING:
                    if (!question.options.min || !question.options.max) {
                        errors.push(`คำถามที่ ${index + 1}: ต้องกำหนดค่าต่ำสุดและค่าสูงสุด`);
                    } else if (Number(question.options.min) >= Number(question.options.max)) {
                        errors.push(`คำถามที่ ${index + 1}: ค่าต่ำสุดต้องน้อยกว่าค่าสูงสุด`);
                    }
                    break;
                case QUESTION_TYPES.NUMBER:
                    if (question.options.min && question.options.max && Number(question.options.min) >= Number(question.options.max)) {
                        errors.push(`คำถามที่ ${index + 1}: ค่าต่ำสุดต้องน้อยกว่าค่าสูงสุด`);
                    }
                    break;
            }
        });

        // Validate evaluation thresholds if any exist
        if (evaluationThresholds.length > 0) {
            evaluationThresholds.forEach((threshold, index) => {
                if (!threshold.result || !threshold.result.trim()) {
                    errors.push(`เกณฑ์การประเมินที่ ${index + 1}: ต้องระบุผลการประเมิน`);
                }
                if (threshold.minScore === '' || threshold.maxScore === '') {
                    errors.push(`เกณฑ์การประเมินที่ ${index + 1}: ต้องระบุช่วงคะแนน`);
                } else if (Number(threshold.minScore) >= Number(threshold.maxScore)) {
                    errors.push(`เกณฑ์การประเมินที่ ${index + 1}: คะแนนต่ำสุดต้องน้อยกว่าคะแนนสูงสุด`);
                }
            });
        }

        return errors;
    };

    const handleSave = async () => {
        const validationErrors = validateForm();
        
        if (validationErrors.length > 0) {
            toast.error("กรุณาแก้ไขข้อผิดพลาดต่อไปนี้:", {
                description: validationErrors.join('\n'),
            });
            return;
        }

        setIsSaving(true);
        const formPayload = {
            title: formTitle,
            description: formDescription,
            questions: questions,
            evaluationThresholds: evaluationThresholds,
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
                                <Label htmlFor="form-title" className="pb-2 text-lg">
                                    ชื่อฟอร์ม <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    id="form-title" 
                                    value={formTitle} 
                                    onChange={e => setFormTitle(e.target.value)} 
                                    placeholder="เช่น, ตรวจสุขภาพรายวัน" 
                                    className={`text-base ${!formTitle.trim() ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                />
                            </div>
                            <div>
                                <Label htmlFor="form-description" className="pb-2 text-lg">
                                    คำอธิบายฟอร์ม <span className="text-red-500">*</span>
                                </Label>
                                <Textarea 
                                    id="form-description" 
                                    value={formDescription} 
                                    onChange={e => setFormDescription(e.target.value)} 
                                    placeholder="คำอธิบายสั้นๆ เกี่ยวกับวัตถุประสงค์ของฟอร์ม" 
                                    className={`text-base ${!formDescription.trim() ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                />
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

                    {/* Evaluation Thresholds */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">เกณฑ์การประเมิน</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                กำหนดช่วงคะแนนและผลการประเมินที่สอดคล้องกัน
                            </p>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {evaluationThresholds.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>ยังไม่มีเกณฑ์การประเมิน</p>
                                    <p className="text-sm">คลิก "เพิ่มเกณฑ์การประเมิน" เพื่อเริ่มต้น</p>
                                </div>
                            )}
                            {evaluationThresholds.map((threshold, index) => (
                                <div key={index} className="flex items-end gap-2 p-4 border rounded-lg">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-sm">ช่วงคะแนน</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="คะแนนต่ำสุด *"
                                                value={threshold.minScore || ''}
                                                onChange={(e) => updateThreshold(index, 'minScore', Number(e.target.value))}
                                                className={`w-24 ${threshold.minScore === '' ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                                onWheel={(e) => e.currentTarget.blur()}
                                            />
                                            <span className="text-sm text-muted-foreground">ถึง</span>
                                            <Input
                                                type="number"
                                                placeholder="คะแนนสูงสุด *"
                                                value={threshold.maxScore || ''}
                                                onChange={(e) => updateThreshold(index, 'maxScore', Number(e.target.value))}
                                                className={`w-24 ${threshold.maxScore === '' ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                                onWheel={(e) => e.currentTarget.blur()}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-sm">ผลการประเมิน <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="เช่น ดีมาก, ดี, ปานกลาง, ต้องปรับปรุง"
                                            value={threshold.result}
                                            onChange={(e) => updateThreshold(index, 'result', e.target.value)}
                                            className={`${!threshold.result?.trim() ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-sm">คำอธิบาย (ไม่บังคับ)</Label>
                                        <Input
                                            placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับผลการประเมิน"
                                            value={threshold.description}
                                            onChange={(e) => updateThreshold(index, 'description', e.target.value)}
                                        />
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeThreshold(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addThreshold}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                เพิ่มเกณฑ์การประเมิน
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col items-end gap-2">
                        {!isFormValid() && (
                            <p className="text-sm text-red-500">
                                กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ช่องที่มีเครื่องหมาย *)
                            </p>
                        )}
                        <Button 
                            onClick={handleSave} 
                            size="lg" 
                            className="text-lg" 
                            disabled={isSaving || !isFormValid()}
                        >
                            {isSaving ? "กำลังบันทึก..." : "บันทึกฟอร์ม"}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
