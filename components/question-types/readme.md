## Question Object Spec

{
  "baseQuestionInterface": {
    "id": "number",
    "form_id": "number",
    "question_text": "string - The text content of the question",
    "question_type": "string - Determines the type of question (mcq, text, rating, true_false, number)",
    "options": "object - Contains configuration specific to each question type",
    "is_required": "boolean - Whether an answer is mandatory",
    "helper_text": "string (optional) - Additional guidance text for the user",
    "created_at": "string - ISO timestamp of creation",
    "updated_at": "string - ISO timestamp of last update"
  },
  "questionTypes": {
    "multipleChoice": {
      "aliases": ["mcq", "multiple_choice"],
      "description": "A question with predefined choices where the user selects one option",
      "optionsStructure": {
        "choices": "Array of strings representing the available options",
        "allowOther": "boolean (optional) - Whether to allow a custom 'Other' option"
      }
    },
    "text": {
      "aliases": ["text", "textbox", "textarea"],
      "description": "A question that accepts free-form text input",
      "optionsStructure": {
        "multiline": "boolean (optional) - Whether to display a larger text area",
        "maxLength": "number (optional) - Maximum character length",
        "placeholder": "string (optional) - Placeholder text"
      }
    },
    "rating": {
      "aliases": ["rating", "rate"],
      "description": "A question that collects a rating on a scale",
      "optionsStructure": {
        "min": "number - Minimum value of the rating scale",
        "max": "number - Maximum value of the rating scale",
        "step": "number (optional) - Increment size between rating options",
        "labels": "object (optional) - Text labels for min/max values"
      }
    },
    "trueFalse": {
      "aliases": ["true_false", "boolean"],
      "description": "A question with binary true/false options",
      "optionsStructure": {
        "trueLabel": "string (optional) - Custom label for the 'true' option",
        "falseLabel": "string (optional) - Custom label for the 'false' option"
      }
    },
    "number": {
      "aliases": ["number", "numeric"],
      "description": "A question that accepts numerical input",
      "optionsStructure": {
        "min": "number (optional) - Minimum allowed value",
        "max": "number (optional) - Maximum allowed value",
        "step": "number (optional) - Increment size",
        "placeholder": "string (optional) - Placeholder text"
      }
    }
  },
  "userInteraction": {
    "value": "string - The current answer value for the question",
    "onChange": "function - Handler that updates the answer value"
  }
}