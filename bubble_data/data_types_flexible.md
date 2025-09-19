# Bubble.io Data Types for Flexible Questions

## 📊 **Recommended Data Type: Question (Option 3)**

If you choose individual question records, create this data type in Bubble:

### **Question Data Type Fields:**
```
- quiz_id (Quiz) - Reference to Quiz
- question_text (text) - The question
- options (text) - JSON array of options: ["Option 1", "Option 2", "Option 3"]
- correct_answer (number) - Index of correct option (0-based)
- order_index (number) - Question order within quiz
```

### **Benefits of Flexible Options:**
- ✅ **Variable option count** - 2, 3, 4, 5+ options per question
- ✅ **True/False questions** - Just 2 options
- ✅ **Multiple choice** - 3-6 options as needed
- ✅ **Easy management** - Add/remove options without schema changes
- ✅ **Future-proof** - Supports new question types

### **Sample Data Structure:**
```json
{
  "question_text": "What is the main goal of AI?",
  "options": ["Replace humans", "Augment human capabilities", "Make money"],
  "correct_answer": 1
}
```

### **Quiz Examples with Variable Options:**

**True/False Question (2 options):**
```
Question: "AI will completely replace human workers"
Options: ["True", "False"]
Correct: 1 (False)
```

**Multiple Choice (3 options):**
```
Question: "Which metric measures chatbot success?"
Options: ["Speed only", "Customer satisfaction", "Number of responses"]
Correct: 1 (Customer satisfaction)
```

**Extended Multiple Choice (5 options):**
```
Question: "What should be automated first?"
Options: ["Complex decisions", "High-volume repetitive tasks", "Creative work", "Customer relationships", "Strategic planning"]
Correct: 1 (High-volume repetitive tasks)
```

## 🔧 **Mobile App Compatibility**

The current mobile app code in `app/quiz/[quizId].tsx` already supports flexible options:

```javascript
// This code works with any number of options
quiz.questions.forEach((question, index) => {
  question.options.map((option, optionIndex) => (
    <TouchableOpacity key={optionIndex}>
      <Text>{option}</Text>
    </TouchableOpacity>
  ))
});
```

**No code changes needed** - the app dynamically renders however many options are provided!