"use client";

import React, { useState, useRef, useEffect } from 'react';
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


interface Question {
    id: string;
    question_text: string;
    question_type: QuestionType;
    is_required: boolean;
    helper_text: string;
    options: any;
}

interface EvaluationThreshold {
    minScore: string | number;
    maxScore: string | number;
    result: string;
    description: string;
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
            // Keep the value as-is to allow proper typing
            newChoices[index] = { ...newChoices[index], score: value };
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
                        <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1">
                                <Label className="text-sm text-muted-foreground">ตัวเลือก</Label>
                            </div>
                            <div className="w-24">
                                <Label className="text-sm text-muted-foreground">คะแนน</Label>
                            </div>
                            <div className="w-10"></div>
                        </div>
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
                                        value={typeof choice === 'string' ? '' : (choice.score !== undefined ? choice.score : '')}
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
                        <Input placeholder="ข้อความตัวอย่าง" value={question.options.placeholder ?? ''} onChange={e => handleOptionChange('placeholder', e.target.value)} />
                        <Input 
                            type="number" 
                            placeholder="ความยาวสูงสุด" 
                            value={question.options.maxLength !== undefined && question.options.maxLength !== null ? question.options.maxLength : ''} 
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
                                value={question.options.min !== undefined && question.options.min !== null ? question.options.min : ''} 
                                onChange={e => handleOptionChange('min', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                                className={`${(question.options.min === '' || question.options.min === undefined || question.options.min === null) && question.options.min !== 0 ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                            />
                            <Input 
                                type="number" 
                                placeholder="ค่าสูงสุด (เช่น 5) *" 
                                value={question.options.max !== undefined && question.options.max !== null ? question.options.max : ''} 
                                onChange={e => handleOptionChange('max', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                                className={`${(question.options.max === '' || question.options.max === undefined || question.options.max === null) && question.options.max !== 0 ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                            />
                        </div>
                        <Input 
                            type="number" 
                            placeholder="ขั้น (ไม่บังคับ)" 
                            value={question.options.step !== undefined && question.options.step !== null ? question.options.step : ''} 
                            onChange={e => handleOptionChange('step', e.target.value)} 
                            onWheel={(e) => e.currentTarget.blur()}
                        />
                        <div>
                            <Label className="text-sm">ตัวคูณคะแนน (คะแนน = ค่าที่เลือก × ตัวคูณ)</Label>
                            <Input 
                                type="number" 
                                placeholder="1" 
                                value={question.options.scoreMultiplier !== undefined && question.options.scoreMultiplier !== null ? question.options.scoreMultiplier : ''} 
                                onChange={e => handleOptionChange('scoreMultiplier', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="คำอธิบายค่าต่ำสุด (ไม่บังคับ)" value={question.options.labels?.min ?? ''} onChange={e => handleOptionChange('labels', { ...(question.options.labels || {}), min: e.target.value })} />
                            <Input placeholder="คำอธิบายค่าสูงสุด (ไม่บังคับ)" value={question.options.labels?.max ?? ''} onChange={e => handleOptionChange('labels', { ...(question.options.labels || {}), max: e.target.value })} />
                        </div>
                    </div>
                );
            case QUESTION_TYPES.TRUE_FALSE:
                return (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <Label className="text-sm">คำอธิบายสำหรับ 'จริง'</Label>
                                <Input placeholder="เช่น ใช่, ถูกต้อง" value={question.options.trueLabel ?? ''} onChange={e => handleOptionChange('trueLabel', e.target.value)} />
                            </div>
                            <div className="w-24">
                                <Label className="text-sm">คะแนนเมื่อเลือก 'จริง'</Label>
                                <Input 
                                    type="number" 
                                    placeholder="0" 
                                    value={question.options.trueScore !== undefined && question.options.trueScore !== null ? question.options.trueScore : ''} 
                                    onChange={e => handleOptionChange('trueScore', e.target.value)} 
                                    onWheel={(e) => e.currentTarget.blur()}
                                />
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <Label className="text-sm">คำอธิบายสำหรับ 'เท็จ'</Label>
                                <Input placeholder="เช่น ไม่ใช่, ไม่ถูกต้อง" value={question.options.falseLabel ?? ''} onChange={e => handleOptionChange('falseLabel', e.target.value)} />
                            </div>
                            <div className="w-24">
                                <Label className="text-sm">คะแนนเมื่อเลือก 'เท็จ'</Label>
                                <Input 
                                    type="number" 
                                    placeholder="0" 
                                    value={question.options.falseScore !== undefined && question.options.falseScore !== null ? question.options.falseScore : ''} 
                                    onChange={e => handleOptionChange('falseScore', e.target.value)} 
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
                                value={question.options.min !== undefined && question.options.min !== null ? question.options.min : ''} 
                                onChange={e => handleOptionChange('min', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                            <Input 
                                type="number" 
                                placeholder="ค่าสูงสุด" 
                                value={question.options.max !== undefined && question.options.max !== null ? question.options.max : ''} 
                                onChange={e => handleOptionChange('max', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Input 
                                type="number" 
                                placeholder="ขั้น (ไม่บังคับ)" 
                                value={question.options.step !== undefined && question.options.step !== null ? question.options.step : ''} 
                                onChange={e => handleOptionChange('step', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                            <Input placeholder="หน่วย (เช่น กก., ซม.)" value={question.options.unit ?? ''} onChange={e => handleOptionChange('unit', e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-sm">ตัวคูณคะแนน (คะแนน = ตัวเลขที่ป้อน × ตัวคูณ)</Label>
                            <Input 
                                type="number" 
                                placeholder="1" 
                                value={question.options.scoreMultiplier !== undefined && question.options.scoreMultiplier !== null ? question.options.scoreMultiplier : ''} 
                                onChange={e => handleOptionChange('scoreMultiplier', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                        </div>
                        <Input placeholder="ข้อความตัวอย่าง" value={question.options.placeholder ?? ''} onChange={e => handleOptionChange('placeholder', e.target.value)} />
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
    const [formLabel, setFormLabel] = useState('');
    const [timeToComplete, setTimeToComplete] = useState('');
    const [priorityLevel, setPriorityLevel] = useState('medium');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [evaluationThresholds, setEvaluationThresholds] = useState<EvaluationThreshold[]>([]);
    const [recurrenceInterval, setRecurrenceInterval] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string>('');

    // Refs for auto-focus on validation errors
    const formTitleRef = useRef<HTMLInputElement>(null);
    const formDescriptionRef = useRef<HTMLTextAreaElement>(null);
    const formLabelRef = useRef<HTMLInputElement>(null);
    const timeToCompleteRef = useRef<HTMLInputElement>(null);
    const questionRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

    // Run validation whenever form fields change (including on initial mount)
    useEffect(() => {
        isFormValid();
    }, [formTitle, formDescription, formLabel, timeToComplete, questions, evaluationThresholds]);

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
        const newThresholds = [...evaluationThresholds];
        newThresholds.splice(index, 1);
        setEvaluationThresholds(newThresholds);
    };

    // Check for overlapping score ranges
    const checkOverlaps = () => {
        const overlaps: string[] = [];
        const sortedThresholds = [...evaluationThresholds]
            .map((t, idx) => ({ ...t, originalIndex: idx }))
            .filter(t => t.minScore !== '' && t.maxScore !== '')
            .sort((a, b) => Number(a.minScore) - Number(b.minScore));

        for (let i = 0; i < sortedThresholds.length - 1; i++) {
            const current = sortedThresholds[i];
            const next = sortedThresholds[i + 1];
            
            if (Number(current.maxScore) >= Number(next.minScore)) {
                overlaps.push(`เกณฑ์ที่ ${current.originalIndex + 1} (${current.minScore}-${current.maxScore}) และเกณฑ์ที่ ${next.originalIndex + 1} (${next.minScore}-${next.maxScore}) มีช่วงคะแนนที่ทับซ้อนกัน`);
            }
        }
        return overlaps;
    };

    const isFormValid = () => {
        const validation = validateForm();
        setValidationError(validation.error || '');
        return validation.isValid;
    };

    const validateForm = (): { isValid: boolean; error?: string; focusElement?: HTMLElement | null; scrollToElement?: HTMLElement | null } => {
        // Check form title
        if (!formTitle.trim()) {
            return {
                isValid: false,
                error: "กรุณากรอกชื่อแบบสอบถาม",
                focusElement: formTitleRef.current
            };
        }

        // Check form description
        if (!formDescription.trim()) {
            return {
                isValid: false,
                error: "กรุณากรอกคำอธิบายแบบสอบถาม",
                focusElement: formDescriptionRef.current
            };
        }

        // Check form label
        if (!formLabel.trim()) {
            return {
                isValid: false,
                error: "กรุณากรอกป้ายกำกับแบบสอบถาม",
                focusElement: formLabelRef.current
            };
        }

        // Check time to complete
        if (!timeToComplete || Number(timeToComplete) <= 0) {
            return {
                isValid: false,
                error: "กรุณากรอกเวลาในการทำแบบสอบถาม (ต้องมากกว่า 0 นาที)",
                focusElement: timeToCompleteRef.current
            };
        }

        // Check if there are questions
        if (questions.length === 0) {
            return {
                isValid: false,
                error: "กรุณาเพิ่มคำถามอย่างน้อย 1 คำถาม"
            };
        }

        // Validate each question
        for (let index = 0; index < questions.length; index++) {
            const question = questions[index];
            const questionElement = questionRefs.current[question.id];

            if (!question.question_text.trim()) {
                return {
                    isValid: false,
                    error: `คำถามที่ ${index + 1}: กรุณากรอกข้อความคำถาม`,
                    scrollToElement: questionElement
                };
            }

            // Validate question-specific options
            switch (question.question_type) {
                case QUESTION_TYPES.MULTIPLE_CHOICE:
                    if (!question.options.choices || question.options.choices.length === 0) {
                        return {
                            isValid: false,
                            error: `คำถามที่ ${index + 1}: กรุณาเพิ่มตัวเลือกอย่างน้อย 1 ตัวเลือก`,
                            scrollToElement: questionElement
                        };
                    }
                    for (let choiceIndex = 0; choiceIndex < question.options.choices.length; choiceIndex++) {
                        const choice = question.options.choices[choiceIndex];
                        if (!choice.text || !choice.text.trim()) {
                            return {
                                isValid: false,
                                error: `คำถามที่ ${index + 1}, ตัวเลือกที่ ${choiceIndex + 1}: กรุณากรอกข้อความตัวเลือก`,
                                scrollToElement: questionElement
                            };
                        }
                    }
                    break;
                case QUESTION_TYPES.RATING:
                    if (question.options.min === '' || question.options.min === undefined || question.options.max === '' || question.options.max === undefined) {
                        return {
                            isValid: false,
                            error: `คำถามที่ ${index + 1}: กรุณาระบุค่าต่ำสุดและค่าสูงสุด`,
                            scrollToElement: questionElement
                        };
                    }
                    if (Number(question.options.min) >= Number(question.options.max)) {
                        return {
                            isValid: false,
                            error: `คำถามที่ ${index + 1}: ค่าต่ำสุดต้องน้อยกว่าค่าสูงสุด`,
                            scrollToElement: questionElement
                        };
                    }
                    break;
                case QUESTION_TYPES.NUMBER:
                    if (question.options.min !== '' && question.options.min !== undefined && 
                        question.options.max !== '' && question.options.max !== undefined && 
                        Number(question.options.min) >= Number(question.options.max)) {
                        return {
                            isValid: false,
                            error: `คำถามที่ ${index + 1}: ค่าต่ำสุดต้องน้อยกว่าค่าสูงสุด`,
                            scrollToElement: questionElement
                        };
                    }
                    break;
            }
        }

        // Validate evaluation thresholds if any exist
        if (evaluationThresholds.length > 0) {
            // Check for overlaps first
            const overlaps = checkOverlaps();
            if (overlaps.length > 0) {
                return {
                    isValid: false,
                    error: `พบช่วงคะแนนที่ทับซ้อนกัน: ${overlaps[0]}`
                };
            }

            for (let index = 0; index < evaluationThresholds.length; index++) {
                const threshold = evaluationThresholds[index];
                if (!threshold.result || !threshold.result.trim()) {
                    return {
                        isValid: false,
                        error: `เกณฑ์การประเมินที่ ${index + 1}: กรุณาระบุผลการประเมิน`
                    };
                }
                if (threshold.minScore === '' || threshold.maxScore === '') {
                    return {
                        isValid: false,
                        error: `เกณฑ์การประเมินที่ ${index + 1}: กรุณาระบุช่วงคะแนน (คะแนนต่ำสุดและคะแนนสูงสุด)`
                    };
                }
                if (Number(threshold.minScore) > Number(threshold.maxScore)) {
                    return {
                        isValid: false,
                        error: `เกณฑ์การประเมินที่ ${index + 1}: คะแนนต่ำสุดต้องไม่มากกว่าคะแนนสูงสุด`
                    };
                }
            }
        }

        return { isValid: true };
    };

    const handleSave = async () => {
        const validation = validateForm();
        
        if (!validation.isValid) {
            setValidationError(validation.error || "กรุณาตรวจสอบข้อมูลอีกครั้ง");
            toast.error(validation.error || "กรุณาตรวจสอบข้อมูลอีกครั้ง");
            
            // Focus or scroll to the problematic field
            if (validation.focusElement) {
                validation.focusElement.focus();
                validation.focusElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (validation.scrollToElement) {
                validation.scrollToElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setValidationError('');
        setIsSaving(true);
        const formPayload = {
            title: formTitle,
            description: formDescription,
            label: formLabel,
            timeToComplete: Number(timeToComplete),
            priorityLevel: priorityLevel,
            questions: questions,
            evaluationThresholds: evaluationThresholds,
            recurrenceSchedule: recurrenceInterval ? [parseFloat(recurrenceInterval)] : [],
        };

        try {
            const result = await createForm(formPayload);
            if (result.error) {
                toast.error("ไม่สามารถบันทึกแบบสอบถามได้", {
                    description: result.error,
                });
            } else {
                toast.success("บันทึกแบบสอบถามเรียบร้อยแล้ว");
                // Redirect to manage forms page
                router.push('/admin/manage-forms');
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
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
                            <CardTitle className="text-xl font-bold">สร้างแบบสอบถามใหม่</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <Label htmlFor="form-title" className="pb-2 text-lg">
                                    ชื่อแบบสอบถาม <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    ref={formTitleRef}
                                    id="form-title" 
                                    value={formTitle} 
                                    onChange={e => setFormTitle(e.target.value)} 
                                    placeholder="เช่น, ตรวจสุขภาพรายวัน" 
                                    className={`text-base ${!formTitle.trim() ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                />
                            </div>
                            <div>
                                <Label htmlFor="form-description" className="pb-2 text-lg">
                                    คำอธิบายแบบสอบถาม <span className="text-red-500">*</span>
                                </Label>
                                <Textarea 
                                    ref={formDescriptionRef}
                                    id="form-description" 
                                    value={formDescription} 
                                    onChange={e => setFormDescription(e.target.value)} 
                                    placeholder="คำอธิบายสั้นๆ เกี่ยวกับวัตถุประสงค์ของแบบสอบถาม" 
                                    className={`text-base ${!formDescription.trim() ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                />
                            </div>
                            <div>
                                <Label htmlFor="form-label" className="pb-2 text-lg">
                                    หมวดหมู่ <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    ref={formLabelRef}
                                    id="form-label" 
                                    value={formLabel} 
                                    onChange={e => setFormLabel(e.target.value)} 
                                    placeholder="เช่น สุขภาพ, การดูแล, การประเมิน" 
                                    className={`text-base ${!formLabel.trim() ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="time-to-complete" className="pb-2 text-lg">
                                        เวลาในการทำแบบสอบถาม (นาที) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input 
                                        ref={timeToCompleteRef}
                                        id="time-to-complete" 
                                        type="number"
                                        value={timeToComplete} 
                                        onChange={e => setTimeToComplete(e.target.value)} 
                                        placeholder="เช่น 5, 10, 15" 
                                        className={`text-base ${!timeToComplete || Number(timeToComplete) <= 0 ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="priority-level" className="pb-2 text-lg">
                                        ระดับความสำคัญ <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={priorityLevel} onValueChange={setPriorityLevel}>
                                        <SelectTrigger id="priority-level" className="text-base">
                                            <SelectValue placeholder="เลือกระดับความสำคัญ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">ต่ำ</SelectItem>
                                            <SelectItem value="medium">ปานกลาง</SelectItem>
                                            <SelectItem value="high">สูง</SelectItem>
                                            <SelectItem value="urgent">เร่งด่วน</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="recurrence-interval" className="pb-2 text-lg">
                                    ระยะเวลาทำซ้ำ (เดือน)
                                </Label>
                                <Select value={recurrenceInterval} onValueChange={setRecurrenceInterval}>
                                    <SelectTrigger id="recurrence-interval" className="text-base">
                                        <SelectValue placeholder="เลือกความถี่ในการทำซ้ำ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">ทำครั้งเดียว</SelectItem>
                                        <SelectItem value="0.5">ทุก 2 สัปดาห์ (0.5 เดือน)</SelectItem>
                                        <SelectItem value="1">ทุก 1 เดือน</SelectItem>
                                        <SelectItem value="2">ทุก 2 เดือน</SelectItem>
                                        <SelectItem value="3">ทุก 3 เดือน</SelectItem>
                                        <SelectItem value="4">ทุก 4 เดือน</SelectItem>
                                        <SelectItem value="6">ทุก 6 เดือน</SelectItem>
                                        <SelectItem value="12">ทุก 1 ปี (12 เดือน)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground mt-1">
                                    กำหนดระยะเวลาที่ต้องทำแบบประเมินซ้ำ หากไม่ระบุจะถือว่าทำครั้งเดียว
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {questions.map((q) => (
                        <div key={q.id} ref={(el) => { questionRefs.current[q.id] = el; }}>
                            <QuestionEditor
                                question={q}
                                updateQuestion={updateQuestion}
                                removeQuestion={removeQuestion}
                            />
                        </div>
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
                                กำหนดช่วงคะแนนและผลการประเมิน (ช่วงคะแนนต้องไม่ซ้อนทับกัน)
                            </p>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {evaluationThresholds.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>ยังไม่มีเกณฑ์การประเมิน</p>
                                    <p className="text-sm">คลิก "เพิ่มเกณฑ์การประเมิน" เพื่อเริ่มต้น</p>
                                </div>
                            )}
                            
                            {/* Overlap Warning */}
                            {evaluationThresholds.length > 1 && checkOverlaps().length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-yellow-800 mb-1">⚠️ พบช่วงคะแนนที่ทับซ้อนกัน</h4>
                                            <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                                                {checkOverlaps().map((msg, idx) => (
                                                    <li key={idx}>{msg}</li>
                                                ))}
                                            </ul>
                                            <p className="text-xs text-yellow-600 mt-2">💡 แนะนำ: ใช้ช่วงคะแนนที่ไม่ทับซ้อนกัน เช่น 0-2, 3-5, 6-10</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {evaluationThresholds.map((threshold, index) => (
                                <div key={index} className="border-2 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold flex items-center gap-1">
                                                        <span className="text-blue-600">📊</span>
                                                        ช่วงคะแนน <span className="text-red-500">*</span>
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            placeholder="ต่ำสุด"
                                                            value={threshold.minScore}
                                                            onChange={(e) => updateThreshold(index, 'minScore', e.target.value)}
                                                            className={`w-full ${threshold.minScore === '' ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                                                            onWheel={(e) => e.currentTarget.blur()}
                                                        />
                                                        <span className="text-lg font-bold text-gray-400">-</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="สูงสุด"
                                                            value={threshold.maxScore}
                                                            onChange={(e) => updateThreshold(index, 'maxScore', e.target.value)}
                                                            className={`w-full ${threshold.maxScore === '' ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                                                            onWheel={(e) => e.currentTarget.blur()}
                                                        />
                                                    </div>
                                                    {threshold.minScore !== '' && threshold.maxScore !== '' && (
                                                        <p className="text-xs text-gray-500">
                                                            ช่วง: {threshold.minScore} ≤ คะแนน ≤ {threshold.maxScore}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold flex items-center gap-1">
                                                        <span className="text-green-600">✅</span>
                                                        ผลการประเมิน <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        placeholder="เช่น ดีมาก, ดี, ปานกลาง"
                                                        value={threshold.result}
                                                        onChange={(e) => updateThreshold(index, 'result', e.target.value)}
                                                        className={`${!threshold.result?.trim() ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold flex items-center gap-1">
                                                        <span className="text-gray-500">📝</span>
                                                        คำอธิบาย (ไม่บังคับ)
                                                    </Label>
                                                    <Input
                                                        placeholder="คำอธิบายเพิ่มเติม"
                                                        value={threshold.description}
                                                        onChange={(e) => updateThreshold(index, 'description', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeThreshold(index)}
                                            className="flex-shrink-0 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addThreshold} className="w-full md:w-auto">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                เพิ่มเกณฑ์การประเมิน
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col items-end gap-2">
                        {validationError && (
                            <p className="text-sm text-red-500 font-medium">
                                {validationError}
                            </p>
                        )}
                        <Button 
                            onClick={handleSave} 
                            size="lg" 
                            className="text-lg" 
                            disabled={isSaving}
                        >
                            {isSaving ? "กำลังบันทึก..." : "บันทึกแบบสอบถาม"}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
