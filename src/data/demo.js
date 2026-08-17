export const demoTests = [
  {
    id: "academic-mock-01",
    title: "Academic Mock Test 01",
    type: "academic",
    description: "A complete practice test covering Listening, Reading and Writing.",
    duration: 150,
    difficulty: "Mixed",
    published: true,
    skills: ["Listening", "Reading", "Writing"]
  },
  {
    id: "general-mock-01",
    title: "General Training Mock Test 01",
    type: "general",
    description: "General Training practice for Reading and Writing, with Listening.",
    duration: 150,
    difficulty: "Mixed",
    published: true,
    skills: ["Listening", "Reading", "Writing"]
  }
];

export const demoQuestions = [
  {
    id: "L1",
    skill: "listening",
    section: 1,
    number: 1,
    type: "multiple_choice",
    prompt: "What time does the visitor want to arrive?",
    options: ["8:00", "8:30", "9:00", "9:30"],
    answer: "8:30",
    explanation: "The speaker confirms an arrival time of half past eight.",
    difficulty: "easy"
  },
  {
    id: "L2",
    skill: "listening",
    section: 1,
    number: 2,
    type: "short_answer",
    prompt: "Write the visitor's surname.",
    answer: "Morgan",
    acceptedAnswers: ["Morgan"],
    explanation: "The surname is stated clearly during the booking.",
    difficulty: "easy"
  },
  {
    id: "R1",
    skill: "reading",
    section: 1,
    number: 1,
    type: "multiple_choice",
    prompt: "What is the main idea of the passage?",
    passage: "Urban gardens can improve access to fresh food while giving residents shared spaces for learning and community activities. Their success often depends on reliable water, local volunteers and clear management arrangements.",
    options: [
      "Urban gardens are always profitable businesses.",
      "Urban gardens can provide food and community benefits when properly managed.",
      "Urban gardens require no maintenance.",
      "Urban gardens are replacing all city parks."
    ],
    answer: "Urban gardens can provide food and community benefits when properly managed.",
    explanation: "The passage links food access and community benefits to appropriate management.",
    difficulty: "medium"
  },
  {
    id: "R2",
    skill: "reading",
    section: 1,
    number: 2,
    type: "true_false_not_given",
    prompt: "Urban gardens require no volunteers.",
    options: ["TRUE", "FALSE", "NOT GIVEN"],
    answer: "FALSE",
    explanation: "The passage says success often depends on local volunteers.",
    difficulty: "easy"
  },
  {
    id: "R3",
    skill: "reading",
    section: 1,
    number: 3,
    type: "matching_headings",
    prompt: "Choose the best heading for the passage.",
    options: [
      "A. The management needs of shared urban gardens",
      "B. A history of farming machinery",
      "C. The decline of rural communities",
      "D. International food prices"
    ],
    answer: "A. The management needs of shared urban gardens",
    explanation: "The passage focuses on benefits and the practical requirements for successful urban gardens.",
    difficulty: "medium"
  }
];

export const demoWritingTasks = [
  {
    id: "W1",
    testType: "academic",
    task: 1,
    title: "Academic Writing Task 1",
    prompt: "The chart below compares the amount of time three groups of adults spent on selected forms of exercise in one week. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    visualNote: "Demo visual placeholder — replace with your licensed/owned chart image.",
    minimumWords: 150
  },
  {
    id: "W2",
    testType: "academic",
    task: 2,
    title: "Academic Writing Task 2",
    prompt: "Some people think schools should focus more on practical skills than academic subjects. To what extent do you agree or disagree?",
    minimumWords: 250
  }
];

export const demoSpeaking = [
  {
    id: "S1",
    part: 1,
    title: "Part 1 — Introduction and Interview",
    questions: [
      "Where do you currently live?",
      "What do you enjoy doing in your free time?",
      "Do you prefer studying alone or with other people?"
    ]
  },
  {
    id: "S2",
    part: 2,
    title: "Part 2 — Long Turn",
    cueCard: "Describe a useful skill you would like to learn. You should say what the skill is, why you would like to learn it, how you would learn it, and explain how it could help you."
  },
  {
    id: "S3",
    part: 3,
    title: "Part 3 — Discussion",
    questions: [
      "Why do some skills become more valuable as technology changes?",
      "Should schools teach more practical skills?",
      "How might learning methods change in the future?"
    ]
  }
];

export const bandMap = {
  listening: [
    [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [27, 6.5], [23, 6],
    [18, 5.5], [16, 5], [13, 4.5], [10, 4]
  ],
  reading: [
    [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6],
    [19, 5.5], [15, 5], [13, 4.5], [10, 4]
  ]
};

export function estimateBand(skill, correct, total) {
  if (!total) return 0;
  const map = bandMap[skill] || [];
  for (const [minimum, band] of map) if (correct >= minimum) return band;
  return Math.max(3, Math.round((correct / total) * 9 * 2) / 2);
}

export function calculateOverall(scores) {
  const values = Object.values(scores).filter(v => typeof v === "number" && v > 0);
  if (!values.length) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 2) / 2;
}
