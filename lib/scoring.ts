export function calculateTotalScore(answers: Record<number, string>, questions: any[]): number {
    let totalScore = 0;

    Object.entries(answers).forEach(([questionIdStr, answer]) => {
        const questionId = parseInt(questionIdStr, 10);
        const question = questions.find((q) => q.question_id === questionId);

        if (!question) return;

        let questionScore = 0;

        switch (question.question_type) {
            case 'multiple_choice':
            case 'multipleChoice': {
                const choices = question.options?.choices || [];
                const selectedChoice = choices.find((choice: any) => {
                    const choiceText = typeof choice === 'string' ? choice : (choice.text || choice.choice);
                    return choiceText === answer;
                });
                if (selectedChoice) {
                    questionScore = typeof selectedChoice === 'string' ? 0 : (parseFloat(selectedChoice.score) || 0);
                }
                break;
            }
            case 'true_false':
            case 'trueFalse': {
                const options = question.options || {};
                if (answer === 'true' && options.trueScore !== undefined) {
                    questionScore = parseFloat(options.trueScore) || 0;
                } else if (answer === 'false' && options.falseScore !== undefined) {
                    questionScore = parseFloat(options.falseScore) || 0;
                }
                break;
            }
            case 'rating': {
                const ratingValue = parseFloat(answer || '0');
                const multiplier = Number(question.options?.scoreMultiplier) || 1;
                questionScore = parseFloat((ratingValue * multiplier).toFixed(2));
                break;
            }
            case 'number': {
                const numberValue = parseFloat(answer || '0');
                const numberMultiplier = Number(question.options?.scoreMultiplier) || 1;
                questionScore = parseFloat((numberValue * numberMultiplier).toFixed(2));
                break;
            }
            case 'text':
            default:
                questionScore = 0;
        }

        totalScore += questionScore;
    });

    return totalScore;
}
