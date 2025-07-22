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

// Based on your readme.md spec
const questionTypes = [
    { value: 'multipleChoice', label: 'Multiple Choice' },
    { value: 'text', label: 'Text Input' },
    { value: 'rating', label: 'Rating Scale' },
    { value: 'trueFalse', label: 'True/False' },
    { value: 'number', label: 'Number Input' },
];

const initialQuestionState = {
    id: '',
    question_text: '',
    question_type: 'text',
    is_required: false,
    helper_text: '',
    options: {},
};

function QuestionEditor({ question, updateQuestion, removeQuestion }) {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateQuestion(question.id, { ...question, [name]: value });
    };

    const handleCheckboxChange = (checked) => {
        updateQuestion(question.id, { ...question, is_required: checked });
    };

    const handleTypeChange = (type) => {
        updateQuestion(question.id, { ...question, question_type: type, options: {} });
    };

    const handleOptionChange = (optionName, value) => {
        updateQuestion(question.id, {
            ...question,
            options: { ...question.options, [optionName]: value },
        });
    };
    
    const handleMcqOptionChange = (index, value) => {
        const newChoices = [...(question.options.choices || [])];
        newChoices[index] = { value: value, label: value };
        handleOptionChange('choices', newChoices);
    };

    const addMcqOption = () => {
        const newChoices = [...(question.options.choices || []), {value: '', label: ''}];
        handleOptionChange('choices', newChoices);
    };

    const removeMcqOption = (index) => {
        const newChoices = [...(question.options.choices || [])];
        newChoices.splice(index, 1);
        handleOptionChange('choices', newChoices);
    };


    const renderOptions = () => {
        switch (question.question_type) {
            case 'multipleChoice':
                return (
                    <div className="space-y-2">
                        <Label>Choices</Label>
                        {(question.options.choices || []).map((choice, index) => (
                             <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={choice.value}
                                    onChange={(e) => handleMcqOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeMcqOption(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addMcqOption}>Add Option</Button>
                    </div>
                );
            case 'text':
                return (
                    <div className="space-y-2">
                        <Input placeholder="Placeholder Text" value={question.options.placeholder || ''} onChange={e => handleOptionChange('placeholder', e.target.value)} />
                        <Input type="number" placeholder="Max Length" value={question.options.maxLength || ''} onChange={e => handleOptionChange('maxLength', e.target.value)} />
                    </div>
                );
            case 'rating':
                 return (
                    <div className="flex gap-4">
                        <Input type="number" placeholder="Min Value (e.g., 1)" value={question.options.min || ''} onChange={e => handleOptionChange('min', e.target.value)} />
                        <Input type="number" placeholder="Max Value (e.g., 5)" value={question.options.max || ''} onChange={e => handleOptionChange('max', e.target.value)} />
                    </div>
                );
            case 'trueFalse':
                return (
                     <div className="flex gap-4">
                        <Input placeholder="Label for 'True'" value={question.options.trueLabel || ''} onChange={e => handleOptionChange('trueLabel', e.target.value)} />
                        <Input placeholder="Label for 'False'" value={question.options.falseLabel || ''} onChange={e => handleOptionChange('falseLabel', e.target.value)} />
                    </div>
                );
            case 'number':
                return (
                    <div className="flex gap-4">
                        <Input type="number" placeholder="Min Value" value={question.options.min || ''} onChange={e => handleOptionChange('min', e.target.value)} />
                        <Input type="number" placeholder="Max Value" value={question.options.max || ''} onChange={e => handleOptionChange('max', e.target.value)} />
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
                    <Textarea
                        name="question_text"
                        value={question.question_text}
                        onChange={handleInputChange}
                        placeholder="Type your question here..."
                        className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 p-0 resize-none"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>Question Type</Label>
                        <Select value={question.question_type} onValueChange={handleTypeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a question type" />
                            </SelectTrigger>
                            <SelectContent>
                                {questionTypes.map(qt => (
                                    <SelectItem key={qt.value} value={qt.value}>{qt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Options</Label>
                        {renderOptions()}
                    </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                     <div className="flex items-center gap-2">
                        <Checkbox id={`required-${question.id}`} checked={question.is_required} onCheckedChange={handleCheckboxChange} />
                        <Label htmlFor={`required-${question.id}`}>Required</Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


export default function CreateFormPage() {
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [questions, setQuestions] = useState([]);

    const addQuestion = () => {
        setQuestions([...questions, { ...initialQuestionState, id: uuidv4() }]);
    };

    const updateQuestion = (id, updatedQuestion) => {
        setQuestions(questions.map(q => q.id === id ? updatedQuestion : q));
    };

    const removeQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };
    
    const handleSave = () => {
        const formPayload = {
            title: formTitle,
            description: formDescription,
            questions: questions,
        };
        console.log("Form Payload:", JSON.stringify(formPayload, null, 2));
        // Here you would typically send the payload to your backend API
        alert('Form saved! Check the console for the JSON payload.');
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto p-8">
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Form</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <Label htmlFor="form-title">Form Title</Label>
                                <Input id="form-title" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g., Daily Health Check" />
                            </div>
                            <div>
                                <Label htmlFor="form-description">Form Description</Label>
                                <Textarea id="form-description" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="A short description of the form's purpose." />
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
                        <Button variant="outline" onClick={addQuestion} className="w-full md:w-auto">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Question
                        </Button>
                    </div>
                    
                    <div className="flex justify-end">
                        <Button onClick={handleSave} size="lg">Save Form</Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
