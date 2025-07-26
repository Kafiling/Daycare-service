// Question type constants and utilities

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multipleChoice',
  TEXT: 'text',
  RATING: 'rating',
  TRUE_FALSE: 'trueFalse',
  NUMBER: 'number',
} as const;

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'หลายตัวเลือก',
  [QUESTION_TYPES.TEXT]: 'ป้อนข้อความ',
  [QUESTION_TYPES.RATING]: 'มาตรวัดระดับ',
  [QUESTION_TYPES.TRUE_FALSE]: 'จริง/เท็จ',
  [QUESTION_TYPES.NUMBER]: 'ป้อนตัวเลข',
};

export const getQuestionTypeOptions = () => {
  return Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
};

// Default options for each question type
export const getDefaultOptions = (type: QuestionType) => {
  switch (type) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      return {
        choices: [
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 },
          { text: '', score: 0 }
        ], // Array of choice objects with text and evaluation score
      };
    case QUESTION_TYPES.TRUE_FALSE:
      return {
        trueLabel: 'ใช่',
        falseLabel: 'ไม่ใช่',
        trueScore: 0,
        falseScore: 0,
      };
    case QUESTION_TYPES.RATING:
      return {
        min: 1,
        max: 5,
        labels: { min: '', max: '' },
        scoreMultiplier: 1,
      };
    case QUESTION_TYPES.TEXT:
      return {
        placeholder: '',
        maxLength: null,
        multiline: false,
      };
    case QUESTION_TYPES.NUMBER:
      return {
        placeholder: '',
        min: null,
        max: null,
        scoreMultiplier: 1,
      };
    default:
      return {};
  }
};
