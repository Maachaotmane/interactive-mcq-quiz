# Modern Quiz Application

A comprehensive, interactive quiz application with instant feedback, multi-select support, and customizable time limits. Perfect for educational assessments, training programs, and knowledge testing.

## ✨ Features

### 🎯 Core Functionality
- **Instant Feedback**: Immediate visual feedback after each answer with detailed explanations
- **Multi-Select Support**: Handle both single-choice and multiple-choice questions
- **Smart Scoring**: Accurate scoring for both question types
- **Progress Tracking**: Real-time progress bar and question counter

### ⏱️ Time Management
- **Flexible Time Selection**: Choose quiz duration from 1-240 minutes using an intuitive range slider
- **Smart Difficulty Assessment**: Automatic difficulty calculation based on time per question
  - **Easy**: 60+ seconds per question (Green)
  - **Medium**: 45-59 seconds per question (Yellow) 
  - **Hard**: Under 45 seconds per question (Red)
- **Live Countdown Timer**: Color-coded timer that pauses during feedback
- **Time Statistics**: Detailed time analysis in results

### 📊 Results & Analytics
- **Comprehensive Results**: Percentage score with detailed breakdown
- **Performance Metrics**: Time usage, average per question, completion rate
- **Visual Progress**: Animated progress bars and performance indicators
- **Restart Functionality**: Easy quiz restart with new time selection

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Next.js 14+
- Modern web browser

## 📝 Adding Your Questions

Edit the \`public/data/questions.json\` file with your quiz content. The application supports both single-choice and multiple-choice questions.

### Question Structure

\`\`\`json
{
  "id": 279,
  "rank": 6,
  "question": "Your question text here?",
  "img_url": null,
  "img_width": null,
  "img_height": null,
  "favorite": false,
  "multiple": false,
  "correct": false,
  "explanation": "Detailed explanation of the correct answer...",
  "answers": [
    {
      "value": 801,
      "title": "First answer option",
      "correct": 0
    },
    {
      "value": 802,
      "title": "Second answer option (correct)",
      "correct": 1
    },
    {
      "value": 803,
      "title": "Third answer option",
      "correct": 0
    }
  ]
}
\`\`\`

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| \`id\` | number | Unique identifier for the question |
| \`rank\` | number | Order/priority of the question |
| \`question\` | string | The question text |
| \`img_url\` | string/null | Optional image URL (set to null if no image) |
| \`img_width\` | number/null | Image width in pixels |
| \`img_height\` | number/null | Image height in pixels |
| \`favorite\` | boolean | Bookmark flag (not used in current UI) |
| \`multiple\` | boolean | **true** for multi-select, **false** for single-choice |
| \`correct\` | boolean | Global correct flag (not used in current logic) |
| \`explanation\` | string | Detailed explanation shown after answering |
| \`answers\` | array | Array of answer options |

### Answer Structure

| Field | Type | Description |
|-------|------|-------------|
| \`value\` | number | Unique identifier for the answer |
| \`title\` | string | The answer text displayed to users |
| \`correct\` | number | **1** for correct answer, **0** for incorrect |

## 🎮 Question Types

### Single-Choice Questions
Set \`"multiple": false\` for traditional single-answer questions.

\`\`\`json
{
  "multiple": false,
  "answers": [
    {"value": 1, "title": "Option A", "correct": 0},
    {"value": 2, "title": "Option B", "correct": 1},
    {"value": 3, "title": "Option C", "correct": 0}
  ]
}
\`\`\`

### Multi-Select Questions
Set \`"multiple": true\` for questions requiring multiple correct answers.

\`\`\`json
{
  "multiple": true,
  "answers": [
    {"value": 1, "title": "Correct Option A", "correct": 1},
    {"value": 2, "title": "Incorrect Option", "correct": 0},
    {"value": 3, "title": "Correct Option B", "correct": 1},
    {"value": 4, "title": "Correct Option C", "correct": 1}
  ]
}
\`\`\`

## ⚙️ Configuration

### Time Settings
- **Minimum Time**: 1 minutes
- **Maximum Time**: 240 minutes  
- **Step Increment**: 5 minutes
- **Quick Select Options**: 10m, 15m, 20m, 30m

### Difficulty Calculation
The app automatically calculates difficulty based on time per question:
- **Easy**: 1+ minute per question (relaxed pace)
- **Medium**: 45-59 seconds per question (moderate pace)
- **Hard**: Under 45 seconds per question (challenging pace)

### Default Settings
- Default quiz duration: 10 minutes
- Questions are shuffled on each quiz start
- Duplicate questions are automatically removed
- Timer pauses during feedback display

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

---

**Happy Quizzing! 🎉**
