"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { QUESTION_TYPES, getQuestionTypeOptions, getDefaultOptions, type QuestionType } from '@/lib/question-types';
import { createClient } from "@/utils/supabase/client";
import { updateForm as updateFormAction } from './action';
import { useParams } from 'next/navigation';

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

// Separate component for question editor (same as in create-form)
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
                        <Input placeholder="ข้อความตัวอย่าง" value={question.options.placeholder || ''} onChange={e => handleOptionChange('placeholder', e.target.value)} />
                        <Input 
                            type="number" 
                            placeholder="ความยาวสูงสุด" 
                            value={question.options.maxLength !== undefined ? question.options.maxLength : ''} 
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
                                value={question.options.min !== undefined ? question.options.min : ''} 
                                onChange={e => handleOptionChange('min', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                                className={`${(question.options.min === '' || question.options.min === undefined) && question.options.min !== 0 ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                            />
                            <Input 
                                type="number" 
                                placeholder="ค่าสูงสุด (เช่น 5) *" 
                                value={question.options.max !== undefined ? question.options.max : ''} 
                                onChange={e => handleOptionChange('max', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                                className={`${(question.options.max === '' || question.options.max === undefined) && question.options.max !== 0 ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                            />
                        </div>
                        <Input 
                            type="number" 
                            placeholder="ขั้น (ไม่บังคับ)" 
                            value={question.options.step !== undefined ? question.options.step : ''} 
                            onChange={e => handleOptionChange('step', e.target.value)} 
                            onWheel={(e) => e.currentTarget.blur()}
                        />
                        <div>
                            <Label className="text-sm">ตัวคูณคะแนน (คะแนน = ค่าที่เลือก × ตัวคูณ)</Label>
                            <Input 
                                type="number" 
                                placeholder="1" 
                                value={question.options.scoreMultiplier !== undefined ? question.options.scoreMultiplier : ''} 
                                onChange={e => handleOptionChange('scoreMultiplier', e.target.value)} 
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
                                    value={question.options.trueScore !== undefined ? question.options.trueScore : ''} 
                                    onChange={e => handleOptionChange('trueScore', e.target.value)} 
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
                                    value={question.options.falseScore !== undefined ? question.options.falseScore : ''} 
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
                                value={question.options.min !== undefined ? question.options.min : ''} 
                                onChange={e => handleOptionChange('min', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                            <Input 
                                type="number" 
                                placeholder="ค่าสูงสุด" 
                                value={question.options.max !== undefined ? question.options.max : ''} 
                                onChange={e => handleOptionChange('max', e.target.value)} 
                                onWheel={(e) => e.currentTarget.blur()}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Input 
                                type="number" 
                                placeholder="ขั้น (ไม่บังคับ)" 
                                value={question.options.step !== undefined ? question.options.step : ''} 
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
                                value={question.options.scoreMultiplier !== undefined ? question.options.scoreMultiplier : ''} 
                                onChange={e => handleOptionChange('scoreMultiplier', e.target.value)} 
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

// Function to fetch form data by ID
async function fetchFormById(formId: string) {
    try {
        console.log('Fetching form with ID:', formId);
        const supabase = createClient();
        
        console.log('Querying forms table with form_id:', formId);
        // Fetch form data
        const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('form_id', formId)
            .single();
            
        if (formError) {
            console.error('Error fetching form data:', formError);
            throw new Error(`Error fetching form data: ${formError.message}`);
        }
        
        if (!formData) {
            console.error('Form not found');
            throw new Error('Form not found');
        }
        
        console.log('Form data retrieved successfully:', formData);
        
        // Fetch questions
        console.log('Querying questions for form_id:', formId);
        const { data: questionsData, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('form_id', formId)
            .order('question_id', { ascending: true });
            
        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            throw new Error(`Error fetching questions: ${questionsError.message}`);
        }
        
        console.log('Questions data retrieved successfully, count:', questionsData?.length);
        
        // Get evaluation thresholds from the form data itself
        // The schema indicates evaluation_thresholds is a JSON column in the forms table
        let formattedThresholds: Array<{
            minScore: number;
            maxScore: number;
            result: string;
            description: string;
        }> = [];
        
        if (formData.evaluation_thresholds) {
            console.log('Using evaluation_thresholds from forms table:', formData.evaluation_thresholds);
            
            // Parse if it's a string, or use directly if it's already an object
            let thresholds = typeof formData.evaluation_thresholds === 'string' 
                ? JSON.parse(formData.evaluation_thresholds) 
                : formData.evaluation_thresholds;
                
            // Format thresholds for the UI
            formattedThresholds = Array.isArray(thresholds) ? thresholds.map(threshold => ({
                minScore: threshold.min_score || threshold.minScore,
                maxScore: threshold.max_score || threshold.maxScore,
                result: threshold.result,
                description: threshold.description
            })) : [];
        } else {
            console.log('No evaluation_thresholds found in form data');
        }
        
        return {
            ...formData,
            questions: questionsData,
            evaluation_thresholds: formattedThresholds
        };
    } catch (error) {
        console.error('Error fetching form:', error);
        throw error;
    }
}

export default function EditFormPage() {
    const params = useParams();
    const formId = params.formId as string;
    
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formLabel, setFormLabel] = useState('');
    const [timeToComplete, setTimeToComplete] = useState('');
    const [priorityLevel, setPriorityLevel] = useState('medium');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [evaluationThresholds, setEvaluationThresholds] = useState<any[]>([]);
    const [recurrenceInterval, setRecurrenceInterval] = useState<string>('');
    const [isActive, setIsActive] = useState(true);

    // Load form data when component mounts
    useEffect(() => {
        const loadForm = async () => {
            try {
                setIsLoading(true);
                console.log('Loading form with ID:', formId);
                
                if (!formId) {
                    console.error('Form ID is undefined or empty');
                    toast.error('Invalid form ID');
                    router.push('/admin/manage-forms');
                    return;
                }
                
                const formData = await fetchFormById(formId);
                
                // Set form basic info
                setFormTitle(formData.title || '');
                setFormDescription(formData.description || '');
                setFormLabel(formData.label || '');
                setTimeToComplete(formData.time_to_complete?.toString() || '');
                setPriorityLevel(formData.priority_level || 'medium');
                setIsActive(formData.is_active);
                
                // Set evaluation thresholds
                setEvaluationThresholds(formData.evaluation_thresholds || []);
                
                // Set recurrence interval
                if (formData.recurrence_schedule && Array.isArray(formData.recurrence_schedule) && formData.recurrence_schedule.length > 0) {
                    setRecurrenceInterval(formData.recurrence_schedule[0].toString());
                }

                // Format questions
                if (formData.questions && formData.questions.length > 0) {
                    const formattedQuestions = formData.questions.map((q: any) => ({
                        id: q.question_id.toString(), // Use question_id as the id
                        question_text: q.question_text || '',
                        question_type: q.question_type || QUESTION_TYPES.TEXT,
                        is_required: q.is_required || false,
                        helper_text: q.helper_text || '',
                        options: q.options || getDefaultOptions(q.question_type || QUESTION_TYPES.TEXT),
                    }));
                    setQuestions(formattedQuestions);
                }
            } catch (error: any) {
                console.error('Error in loadForm:', error);
                toast.error(error.message || 'ไม่สามารถโหลดข้อมูลแบบสอบถามได้');
                setTimeout(() => {
                    router.push('/admin/manage-forms');
                }, 2000);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadForm();
    }, [formId, router]);

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
            errors.push("ชื่อแบบสอบถามเป็นข้อมูลที่จำเป็น");
        }

        // Check form description
        if (!formDescription.trim()) {
            errors.push("คำอธิบายแบบสอบถามเป็นข้อมูลที่จำเป็น");
        }

        // Check form label
        if (!formLabel.trim()) {
            errors.push("ป้ายกำกับแบบสอบถามเป็นข้อมูลที่จำเป็น");
        }

        // Check time to complete
        if (!timeToComplete || Number(timeToComplete) <= 0) {
            errors.push("เวลาในการทำแบบสอบถามต้องมากกว่า 0 นาที");
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
                    if (question.options.min === '' || question.options.min === undefined || question.options.max === '' || question.options.max === undefined) {
                        errors.push(`คำถามที่ ${index + 1}: ต้องกำหนดค่าต่ำสุดและค่าสูงสุด`);
                    } else if (Number(question.options.min) >= Number(question.options.max)) {
                        errors.push(`คำถามที่ ${index + 1}: ค่าต่ำสุดต้องน้อยกว่าค่าสูงสุด`);
                    }
                    break;
                case QUESTION_TYPES.NUMBER:
                    if (question.options.min !== '' && question.options.min !== undefined && 
                        question.options.max !== '' && question.options.max !== undefined && 
                        Number(question.options.min) >= Number(question.options.max)) {
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

        // Prepare questions data with correct question_id
        const questionsData = questions.map((q, index) => ({
            question_id: index + 1,
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: q.is_required,
            helper_text: q.helper_text,
            options: q.options
        }));
        
        const formPayload = {
            title: formTitle,
            description: formDescription,
            label: formLabel,
            time_to_complete: Number(timeToComplete),
            priority_level: priorityLevel,
            is_active: isActive,
            evaluation_thresholds: evaluationThresholds,
            recurrence_schedule: recurrenceInterval ? [parseFloat(recurrenceInterval)] : [],
            questions: questionsData
        };

        try {
            const result = await updateFormAction(formId, formPayload);
            if (result.success) {
                toast.success("แบบสอบถามถูกบันทึกเรียบร้อยแล้ว");
                router.push('/admin/manage-forms');
            } else {
                toast.error(`เกิดข้อผิดพลาดในการบันทึกแบบสอบถาม: ${result.error}`);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึกแบบสอบถาม");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-lg text-muted-foreground">กำลังโหลดข้อมูลแบบสอบถาม...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-8">
                <Button 
                    variant="ghost" 
                    className="mb-6 gap-2"
                    onClick={() => router.push('/admin/manage-forms')}
                >
                    <ArrowLeft className="h-4 w-4" />
                    กลับไปยังหน้าจัดการแบบสอบถาม
                </Button>
                
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">แก้ไขแบบสอบถาม</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <Label htmlFor="form-title" className="pb-2 text-lg">
                                    ชื่อแบบสอบถาม <span className="text-red-500">*</span>
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
                                    คำอธิบายแบบสอบถาม <span className="text-red-500">*</span>
                                </Label>
                                <Textarea 
                                    id="form-description" 
                                    value={formDescription} 
                                    onChange={e => setFormDescription(e.target.value)} 
                                    placeholder="คำอธิบายสั้นๆ เกี่ยวกับวัตถุประสงค์ของแบบสอบถาม" 
                                    className={`text-base ${!formDescription.trim() ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                />
                            </div>
                            <div>
                                <Label htmlFor="form-label" className="pb-2 text-lg">
                                    ป้ายกำกับ <span className="text-red-500">*</span>
                                </Label>
                                <Input 
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
                            <div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="is-active" 
                                        checked={isActive} 
                                        onCheckedChange={(checked) => setIsActive(!!checked)} 
                                    />
                                    <Label htmlFor="is-active" className="text-lg">เปิดใช้งานแบบสอบถาม</Label>
                                </div>
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
                                                value={threshold.minScore}
                                                onChange={(e) => updateThreshold(index, 'minScore', e.target.value)}
                                                className={`w-24 ${threshold.minScore === '' ? 'border-red-300 focus-visible:border-red-500' : ''}`}
                                                onWheel={(e) => e.currentTarget.blur()}
                                            />
                                            <span className="text-sm text-muted-foreground">ถึง</span>
                                            <Input
                                                type="number"
                                                placeholder="คะแนนสูงสุด *"
                                                value={threshold.maxScore}
                                                onChange={(e) => updateThreshold(index, 'maxScore', e.target.value)}
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
                            {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
