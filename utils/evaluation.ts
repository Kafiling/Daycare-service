interface Question {
    question_id: number;
    question_type: string;
    evaluation_scores: any;
    options: any;
}

interface Answer {
    question_id: number;
    answer_value: any;
}

interface EvaluationThreshold {
    minScore: number;
    maxScore: number;
    result: string;
    description: string;
}

// Submission interface matching your database structure
interface Submission {
    id: string;
    patient_id: string;
    nurse_id: string;
    form_id: string;
    submitted_at: string;
    status: string;
    notes?: string;
    total_evaluation_score: number;
    evaluation_result?: string;
    evaluation_description?: string;
}

/**
 * Calculate the evaluation score for a single question based on the answer
 */
export function calculateQuestionScore(question: Question, answer: Answer): number {
    if (answer.question_id !== question.question_id) {
        return 0;
    }

    switch (question.question_type) {
        case 'multipleChoice':
            const selectedIndex = answer.answer_value;
            if (typeof selectedIndex === 'number' && question.evaluation_scores.choices) {
                return question.evaluation_scores.choices[selectedIndex] || 0;
            }
            // Handle "other" option
            if (answer.answer_value === 'other' && question.evaluation_scores.otherScore) {
                return question.evaluation_scores.otherScore;
            }
            return 0;

        case 'trueFalse':
            if (answer.answer_value === true) {
                return question.evaluation_scores.trueScore || 0;
            } else if (answer.answer_value === false) {
                return question.evaluation_scores.falseScore || 0;
            }
            return 0;

        case 'rating':
            const ratingValue = Number(answer.answer_value);
            const scorePerPoint = question.evaluation_scores.scorePerPoint || 1;
            return ratingValue * scorePerPoint;

        case 'number':
            const numberValue = Number(answer.answer_value);
            if (question.evaluation_scores.scoreCalculation === 'direct') {
                return numberValue;
            } else if (question.evaluation_scores.scoreCalculation === 'fixed') {
                return question.evaluation_scores.fixedScore || 0;
            }
            return 0;

        case 'text':
            // For text questions, return base score if answered
            if (answer.answer_value && answer.answer_value.trim() !== '') {
                return question.evaluation_scores.baseScore || 0;
            }
            return 0;

        default:
            return 0;
    }
}

/**
 * Calculate the total evaluation score for all answers
 */
export function calculateTotalScore(questions: Question[], answers: Answer[]): number {
    let totalScore = 0;
    
    for (const question of questions) {
        const answer = answers.find(a => a.question_id === question.question_id);
        if (answer) {
            totalScore += calculateQuestionScore(question, answer);
        }
    }
    
    return totalScore;
}

/**
 * Get the evaluation result based on the total score and thresholds
 */
export function getEvaluationResult(
    totalScore: number, 
    thresholds: EvaluationThreshold[]
): { result: string; description: string } | null {
    if (!thresholds || thresholds.length === 0) {
        return null;
    }
    
    // Sort thresholds by minScore to ensure correct matching
    const sortedThresholds = thresholds.sort((a, b) => a.minScore - b.minScore);
    
    for (const threshold of sortedThresholds) {
        if (totalScore >= threshold.minScore && totalScore <= threshold.maxScore) {
            return {
                result: threshold.result,
                description: threshold.description
            };
        }
    }
    
    return null;
}

/**
 * Get the maximum possible score for a form
 */
export function getMaximumScore(questions: Question[]): number {
    let maxScore = 0;
    
    for (const question of questions) {
        switch (question.question_type) {
            case 'multipleChoice':
                if (question.evaluation_scores.choices) {
                    const maxChoiceScore = Math.max(...question.evaluation_scores.choices, 0);
                    const otherScore = question.evaluation_scores.otherScore || 0;
                    maxScore += Math.max(maxChoiceScore, otherScore);
                }
                break;
                
            case 'trueFalse':
                maxScore += Math.max(
                    question.evaluation_scores.trueScore || 0,
                    question.evaluation_scores.falseScore || 0
                );
                break;
                
            case 'rating':
                const maxRating = Number(question.options.max) || 5;
                const scorePerPoint = question.evaluation_scores.scorePerPoint || 1;
                maxScore += maxRating * scorePerPoint;
                break;
                
            case 'number':
                if (question.evaluation_scores.scoreCalculation === 'direct') {
                    const maxValue = Number(question.options.max) || 0;
                    maxScore += maxValue;
                } else if (question.evaluation_scores.scoreCalculation === 'fixed') {
                    maxScore += question.evaluation_scores.fixedScore || 0;
                }
                break;
                
            case 'text':
                maxScore += question.evaluation_scores.baseScore || 0;
                break;
        }
    }
    
    return maxScore;
}

/**
 * Analyze submission performance
 */
export function analyzeSubmissionPerformance(
    submission: Submission,
    maxScore: number,
    thresholds: EvaluationThreshold[]
): {
    percentage: number;
    performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
    recommendation: string;
} {
    const percentage = maxScore > 0 ? (submission.total_evaluation_score / maxScore) * 100 : 0;
    
    let performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
    let recommendation: string;
    
    if (percentage >= 80) {
        performanceLevel = 'excellent';
        recommendation = 'ผลการประเมินดีมาก ควรรักษาระดับนี้ไว้';
    } else if (percentage >= 60) {
        performanceLevel = 'good';
        recommendation = 'ผลการประเมินดี มีพื้นที่สำหรับการพัฒนาเพิ่มเติม';
    } else if (percentage >= 40) {
        performanceLevel = 'average';
        recommendation = 'ผลการประเมินปานกลาง ควรปรับปรุงในหลายด้าน';
    } else {
        performanceLevel = 'needs_improvement';
        recommendation = 'ผลการประเมินต้องการการปรับปรุงอย่างเร่งด่วน';
    }
    
    return {
        percentage,
        performanceLevel,
        recommendation
    };
}
