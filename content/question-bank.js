// Original IELTS-style practice content. It is not official IELTS material.

const makeMCQ = (id, testId, skill, section, number, prompt, options, answer, explanation, extra = {}) => ({
  id, testId, skill, section, number, type: "multiple_choice", prompt, options, answer, explanation, difficulty: extra.difficulty || "medium", ...extra
});
const makeTFNG = (id, testId, section, number, prompt, answer, explanation, extra = {}) => ({
  id, testId, skill: "reading", section, number, type: "true_false_not_given", prompt,
  options: ["TRUE", "FALSE", "NOT GIVEN"], answer, explanation, difficulty: extra.difficulty || "medium", ...extra
});
const makeShort = (id, testId, section, number, prompt, answer, explanation, extra = {}) => ({
  id, testId, skill: "listening", section, number, type: "short_answer", prompt, answer,
  acceptedAnswers: [answer], explanation, difficulty: extra.difficulty || "medium", ...extra
});
const makeCompletion = (id, testId, section, number, type, prompt, answer, explanation, extra = {}) => ({
  id, testId, skill: "reading", section, number, type, prompt, answer,
  acceptedAnswers: [answer], explanation, difficulty: extra.difficulty || "medium", ...extra
});

const listeningTopics = [
  { section: 1, title: "Community library membership", transcript: "A visitor joins a community library. The librarian explains opening hours, membership requirements, study-room reservations and the annual fee." },
  { section: 2, title: "Town museum visitor information", transcript: "A museum guide explains a new exhibition, the location of galleries, family activities, café facilities and the closing time." },
  { section: 3, title: "University group project", transcript: "Three students discuss a research project. They divide tasks, compare sources, agree on a presentation format and set a deadline." },
  { section: 4, title: "Lecture on sustainable transport", transcript: "A lecturer discusses public transport, cycling infrastructure, travel behaviour, urban planning and the role of technology." }
];

function listeningSet(testId, variant) {
  const q = [];
  const v = variant === 1;
  const sets = v ? [
    ["What day does the library member choose for the study room?", ["Monday", "Tuesday", "Wednesday", "Thursday"], "Wednesday"],
    ["What is the annual membership fee?", ["£12", "£15", "£18", "£20"], "£15"],
    ["Which document is required for registration?", ["A passport photograph", "Proof of address", "A school certificate", "A bank statement"], "Proof of address"],
    ["Where is the children's collection located?", ["On the ground floor", "On the first floor", "In the basement", "Beside the café"], "On the first floor"],
    ["What time does the museum close on Saturdays?", ["4:00", "5:00", "5:30", "6:00"], "5:30"],
    ["Which gallery contains the temporary exhibition?", ["Gallery A", "Gallery B", "Gallery C", "Gallery D"], "Gallery C"],
    ["What activity is offered to families?", ["A drawing workshop", "A film show", "A guided walk", "A cooking class"], "A drawing workshop"],
    ["Where can visitors leave large bags?", ["At the café", "At the reception desk", "In Gallery A", "Outside the museum"], "At the reception desk"],
    ["Who will analyse the survey results?", ["Maya", "Jon", "Lena", "Sam"], "Lena"],
    ["What will the group present first?", ["The literature review", "The survey method", "The budget", "The conclusion"], "The survey method"],
    ["When is the presentation scheduled?", ["Monday morning", "Tuesday afternoon", "Wednesday morning", "Friday afternoon"], "Wednesday morning"],
    ["Which source does the tutor recommend?", ["A government report", "A newspaper article", "A travel blog", "A company brochure"], "A government report"],
    ["According to the lecture, what is a major advantage of buses?", ["They need no roads", "They can carry many passengers", "They are always faster", "They require no planning"], "They can carry many passengers"],
    ["Which measure can encourage cycling?", ["Wider motorways", "Protected cycle lanes", "Higher parking supply", "Longer traffic lights"], "Protected cycle lanes"],
    ["What does the lecturer say about travel apps?", ["They remove all traffic", "They can influence travel choices", "They replace public transport", "They are mainly for tourists"], "They can influence travel choices"]
  ] : [
    ["What time does the appointment begin?", ["8:15", "8:30", "8:45", "9:00"], "8:45"],
    ["What is the customer's surname?", ["Morgan", "Morris", "Martin", "Murray"], "Morris"],
    ["Which service does the customer book?", ["A bicycle repair", "A language lesson", "A swimming class", "A driving test"], "A language lesson"],
    ["How will the customer receive confirmation?", ["By text message", "By post", "By email", "By phone call"], "By email"],
    ["Which entrance should visitors use?", ["North entrance", "East entrance", "West entrance", "South entrance"], "East entrance"],
    ["Where is the information desk?", ["Near the main doors", "Beside the lift", "On the second floor", "Behind the café"], "Near the main doors"],
    ["What is included in the children's programme?", ["A science demonstration", "A dance class", "A book club", "A music lesson"], "A science demonstration"],
    ["When does the guided tour start?", ["10:00", "10:30", "11:00", "11:30"], "11:00"],
    ["Who is responsible for the introduction?", ["Alex", "Priya", "Daniel", "Nora"], "Priya"],
    ["What will the students collect?", ["Photographs", "Interview recordings", "Weather data", "Sales receipts"], "Interview recordings"],
    ["Which part of the report needs more evidence?", ["The introduction", "The methods", "The discussion", "The conclusion"], "The discussion"],
    ["What will they use for the presentation?", ["A poster", "Slides", "A video", "A printed booklet"], "Slides"],
    ["What is one benefit of integrated transport tickets?", ["They reduce route choices", "They simplify transfers", "They eliminate fares", "They increase car use"], "They simplify transfers"],
    ["What can real-time information help passengers do?", ["Avoid every delay", "Choose alternative routes", "Buy cars", "Remove bus stops"], "Choose alternative routes"],
    ["Why can walking be difficult in some cities?", ["There are too many parks", "Routes may be unsafe or disconnected", "People dislike fresh air", "Buses are too cheap"], "Routes may be unsafe or disconnected"]
  ];
  let n = 1;
  for (let section = 1; section <= 4; section++) {
    const topic = listeningTopics[section - 1];
    for (let i = 0; i < 10; i++, n++) {
      const template = sets[(n - 1) % sets.length];
      const [prompt, options, answer] = template;
      if (i === 1 || i === 5) {
        const ans = answer;
        q.push(makeShort(`L-${testId}-${n}`, testId, section, n, `Write the answer for this detail from the ${topic.title.toLowerCase()}: ${prompt}`, ans, `The recording gives the required detail as ${ans}.`, { transcript: topic.transcript }));
      } else {
        q.push(makeMCQ(`L-${testId}-${n}`, testId, "listening", section, n, prompt, options, answer, `The recording identifies ${answer} as the correct detail.`, { transcript: topic.transcript }));
      }
    }
  }
  return q;
}

const academicPassages = [
  { title: "Urban cooling and public space", text: "Cities often retain heat because roads and buildings absorb solar energy during the day and release it slowly at night. Researchers studying urban cooling have found that tree cover, reflective surfaces and accessible water can reduce local temperatures. However, planting trees is not simply a matter of increasing numbers. Species must be selected for local conditions, roots need sufficient space, and long-term maintenance must be planned. Public spaces can also be redesigned so that shade and seating are distributed where people actually walk. These measures may produce health benefits during heat waves, but they work best when combined with building design and transport planning. The most successful programmes therefore treat cooling as part of wider urban policy rather than as an isolated landscaping project." },
  { title: "Learning through retrieval", text: "Educational researchers distinguish between recognising information and retrieving it from memory. A student may recognise an answer when looking at notes but struggle to produce the same answer without those notes. Retrieval practice asks learners to recall information before seeing the correct response. Short quizzes, flashcards and practice questions can all provide retrieval opportunities. The method is most useful when feedback follows an attempt, because learners can correct errors and strengthen accurate knowledge. Retrieval does not mean that every study session should be a test. New information still needs explanation and examples, and difficult material may require several forms of practice. Nevertheless, regular low-stakes retrieval can make later learning more efficient by revealing which ideas have not yet become stable." },
  { title: "Repair economies", text: "The repair economy includes businesses and community organisations that extend the useful life of products. Repair can reduce waste, preserve materials and create local employment, but its growth depends on several conditions. Products must be designed so that components can be accessed and replaced, spare parts need to remain available, and consumers must be able to obtain trustworthy information. Some repair businesses also face competition from inexpensive new goods. Policy makers have therefore explored measures such as right-to-repair rules, product labelling and support for training. Repair will not eliminate the need for manufacturing, but a stronger repair culture can change how people value durability. Instead of treating a broken product as automatically disposable, consumers may begin to see maintenance as part of ownership." }
];

const generalPassages = [
  { title: "Flexible working and local services", text: "Flexible working has changed the relationship between homes, workplaces and local services. Some employees now spend part of the week away from central offices, which can reduce commuting on certain days while increasing daytime activity in residential areas. Cafés, libraries and small shops may benefit from these new patterns, although the effects differ between neighbourhoods. Flexible work can also create challenges: workers need suitable spaces, employers must coordinate teams, and some people may experience weaker social connections. Local authorities have begun considering how public spaces and transport can respond to changing demand. The long-term effect is unlikely to be uniform, because flexible working depends on occupation, household circumstances and the availability of reliable technology." },
  { title: "Community food projects", text: "Community food projects range from shared gardens to cooperative buying schemes. Their objectives are often broader than producing food. Participants may learn cooking, gardening or budgeting skills, while shared activities can strengthen relationships between neighbours. Such projects face practical problems, including land access, volunteer turnover and funding. Successful groups tend to establish clear responsibilities and simple systems for recording costs and harvests. They also adapt activities to the interests of local residents rather than assuming that one model will suit every community. Although community food projects are not a complete solution to food insecurity, they can provide useful social and educational benefits alongside modest improvements in access to fresh produce." },
  { title: "Training for changing workplaces", text: "Employers increasingly need workers who can update their skills as tasks and technologies change. Training can take many forms, from short workshops to mentoring and structured online courses. The most effective programmes usually connect learning with real work rather than treating training as an isolated event. Managers also need to identify which skills are genuinely necessary, because adding courses without a clear purpose can waste time. Employees may prefer flexible training that fits around existing responsibilities, while organisations may need periods of uninterrupted practice. A useful training strategy therefore combines clear goals, opportunities to apply new knowledge and regular review of progress." }
];

function readingSet(testId, general = false) {
  const passages = general ? generalPassages : academicPassages;
  const q = [];
  let number = 1;
  passages.forEach((p, sectionIndex) => {
    const section = sectionIndex + 1;
    const statements = general ? [
      ["Flexible working affects all neighbourhoods in exactly the same way.", "FALSE", "The passage says effects differ between neighbourhoods."],
      ["Community food projects can have educational purposes.", "TRUE", "The passage lists cooking, gardening and budgeting skills."],
      ["All workplace training should take place online.", "FALSE", "The passage describes several forms of training, including workshops and mentoring."]
    ] : [
      ["Urban cooling works best as a separate landscaping programme.", "FALSE", "The passage says cooling works best as part of wider urban policy."],
      ["Retrieval practice can reveal unstable knowledge.", "TRUE", "The passage says retrieval reveals ideas that have not become stable."],
      ["Repair culture completely removes the need to manufacture products.", "FALSE", "The passage explicitly says repair will not eliminate manufacturing."]
    ];
    const options = general ? [
      ["What is one possible effect of flexible working?", ["More daytime activity in some residential areas", "The closure of all libraries", "The end of public transport", "Identical demand everywhere"], "More daytime activity in some residential areas"],
      ["Why do community food groups record costs and harvests?", ["To establish clear and manageable systems", "To avoid all volunteers", "To replace local shops", "To increase land prices"], "To establish clear and manageable systems"],
      ["What makes training more useful?", ["Connecting learning with real work", "Removing all practice", "Adding as many courses as possible", "Avoiding review"], "Connecting learning with real work"]
    ] : [
      ["Which combination can reduce local urban temperatures?", ["Tree cover, reflective surfaces and water", "More traffic, glass and concrete", "Fewer parks and darker roofs", "Only air conditioning"], "Tree cover, reflective surfaces and water"],
      ["Why is feedback important in retrieval practice?", ["It helps learners correct errors", "It removes the need for explanation", "It prevents all difficult questions", "It replaces examples"], "It helps learners correct errors"],
      ["Which condition supports a repair economy?", ["Access to spare parts", "Automatic disposal of products", "Fewer repair skills", "Shorter product lives"], "Access to spare parts"]
    ];
    const [mcPrompt, mcOptions, mcAnswer] = options[sectionIndex];
    q.push(makeMCQ(`R-${testId}-${number}`, testId, "reading", section, number++, mcPrompt, mcOptions, mcAnswer, `The passage supports the answer by explaining the relevant feature of ${p.title.toLowerCase()}.`, { passage: p.text, passageTitle: p.title }));
    q.push(makeTFNG(`R-${testId}-${number}`, testId, section, number++, statements[sectionIndex][0], statements[sectionIndex][1], statements[sectionIndex][2], { passage: p.text, passageTitle: p.title }));
    const completionAnswers = general ? ["technology", "volunteers", "review"] : ["maintenance", "feedback", "durability"];
    q.push(makeCompletion(`R-${testId}-${number}`, testId, section, number++, "sentence_completion", `Complete the sentence using NO MORE THAN TWO WORDS: The passage highlights the importance of ${section === 1 ? "long-term" : section === 2 ? "immediate" : "regular"} ________ in this area.`, completionAnswers[sectionIndex], `The passage refers to ${completionAnswers[sectionIndex]} as an important consideration.`, { passage: p.text, passageTitle: p.title }));
    q.push(makeMCQ(`R-${testId}-${number}`, testId, "reading", section, number++, `Choose the best heading for the passage: ${p.title}`, [p.title, "A history of international trade", "The decline of modern education", "Unrelated technological inventions"], p.title, `The passage consistently focuses on ${p.title.toLowerCase()}.`, { passage: p.text, passageTitle: p.title, type: "matching_headings" }));
    q.push(makeCompletion(`R-${testId}-${number}`, testId, section, number++, "summary_completion", `Complete the summary of the passage: The author argues that successful approaches require clear planning and ________.`, general ? "adaptation" : "planning", `The passage emphasises practical planning and the need to adapt approaches to circumstances.`, { passage: p.text, passageTitle: p.title }));
  });
  // Add a further 25 questions by revisiting passage evidence with different IELTS-style tasks.
  const extraPrompts = general ? [
    ["Which group may benefit from flexible working patterns?", ["Some local service providers", "Only international airlines", "All schools", "No businesses"], "Some local service providers"],
    ["What can cause difficulties for community food projects?", ["Volunteer turnover", "Unlimited funding", "Too much land", "No interest from residents"], "Volunteer turnover"],
    ["What should managers identify before adding training courses?", ["Genuinely necessary skills", "More holidays", "Office furniture", "Transport fares"], "Genuinely necessary skills"]
  ] : [
    ["Why must tree species be selected carefully?", ["They need to suit local conditions", "They never require water", "They replace transport planning", "They always grow quickly"], "They need to suit local conditions"],
    ["What should follow a retrieval attempt?", ["Feedback", "A longer lecture", "No correction", "Immediate grading only"], "Feedback"],
    ["What can product labelling support?", ["Repair decisions", "Faster disposal", "Less access to parts", "Shorter warranties"], "Repair decisions"]
  ];
  for (let i = 0; i < 25; i++) {
    const s = (i % 3) + 1;
    const p = passages[s - 1];
    const [prompt, opts, ans] = extraPrompts[i % extraPrompts.length];
    q.push(makeMCQ(`R-${testId}-${number}`, testId, "reading", s, number++, prompt, opts, ans, `The passage provides evidence for ${ans}.`, { passage: p.text, passageTitle: p.title, difficulty: i % 4 === 0 ? "hard" : "medium" }));
  }
  return q.slice(0, 40);
}

export const questionBankTests = [
  { id: "academic-mock-01", title: "Academic Mock Test 01", type: "academic", description: "Original IELTS-style Academic practice test.", duration: 150, difficulty: "Mixed", published: true, skills: ["Listening", "Reading", "Writing"], questionCounts: { listening: 40, reading: 40 } },
  { id: "academic-mock-02", title: "Academic Mock Test 02", type: "academic", description: "Original IELTS-style Academic practice test with a second question set.", duration: 150, difficulty: "Mixed", published: true, skills: ["Listening", "Reading", "Writing"], questionCounts: { listening: 40, reading: 40 } },
  { id: "general-mock-01", title: "General Training Mock Test 01", type: "general", description: "Original IELTS-style General Training practice test.", duration: 150, difficulty: "Mixed", published: true, skills: ["Listening", "Reading", "Writing"], questionCounts: { listening: 40, reading: 40 } },
  { id: "general-mock-02", title: "General Training Mock Test 02", type: "general", description: "Original IELTS-style General Training practice test with a second question set.", duration: 150, difficulty: "Mixed", published: true, skills: ["Listening", "Reading", "Writing"], questionCounts: { listening: 40, reading: 40 } }
];

export const questionBankQuestions = [
  ...listeningSet("academic-mock-01", 1),
  ...listeningSet("academic-mock-02", 2),
  ...listeningSet("general-mock-01", 1),
  ...listeningSet("general-mock-02", 2),
  ...readingSet("academic-mock-01", false),
  ...readingSet("academic-mock-02", false),
  ...readingSet("general-mock-01", true),
  ...readingSet("general-mock-02", true)
];

export const writingTasks = [
  { id: "WA1-01", testType: "academic", task: 1, title: "Academic Task 1 — Public transport", prompt: "The chart shows the percentage of commuters using four forms of transport in a city in 2005 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", minimumWords: 150, published: true },
  { id: "WA2-01", testType: "academic", task: 2, title: "Academic Task 2 — Practical education", prompt: "Some people believe schools should give more time to practical skills than academic subjects. To what extent do you agree or disagree?", minimumWords: 250, published: true },
  { id: "WA1-02", testType: "academic", task: 1, title: "Academic Task 1 — Water consumption", prompt: "The table compares average household water use for six activities in two countries. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", minimumWords: 150, published: true },
  { id: "WA2-02", testType: "academic", task: 2, title: "Academic Task 2 — Technology and communication", prompt: "Technology makes it easier for people to communicate, but some believe it has weakened face-to-face relationships. Discuss both views and give your own opinion.", minimumWords: 250, published: true },
  { id: "WG1-01", testType: "general", task: 1, title: "General Training Task 1 — Community facility", prompt: "You recently used a community sports centre and were dissatisfied with one aspect of the service. Write a letter to the manager explaining the problem and suggesting what should be done.", minimumWords: 150, published: true },
  { id: "WG2-01", testType: "general", task: 2, title: "General Training Task 2 — Working hours", prompt: "Some people think employees should be allowed to choose their working hours. Discuss the advantages and disadvantages and give your opinion.", minimumWords: 250, published: true },
  { id: "WG1-02", testType: "general", task: 1, title: "General Training Task 1 — Accommodation", prompt: "You are going to stay with a friend in another city. Write a letter explaining when you will arrive, what you need and what you would like to do during your visit.", minimumWords: 150, published: true },
  { id: "WG2-02", testType: "general", task: 2, title: "General Training Task 2 — Public spaces", prompt: "Some people believe cities should spend more money creating public parks and spaces rather than building new shopping facilities. Discuss both views and give your opinion.", minimumWords: 250, published: true }
];

export const speakingPrompts = [
  { id: "SP1-01", part: 1, title: "Part 1 — Home and routines", questions: ["Where do you live?", "What do you like about the area where you live?", "How do you usually spend your evenings?"] , published: true},
  { id: "SP2-01", part: 2, title: "Part 2 — A useful skill", cueCard: "Describe a useful skill you would like to learn. You should say what it is, why you want to learn it, how you would learn it, and explain how it would help you.", published: true },
  { id: "SP3-01", part: 3, title: "Part 3 — Skills and education", questions: ["Which skills are most important for young people today?", "Should employers provide training for new skills?", "How might education change as technology develops?"], published: true },
  { id: "SP1-02", part: 1, title: "Part 1 — Work and study", questions: ["What do you do during the day?", "What part of your work or studies do you enjoy most?", "Do you prefer a fixed routine or a flexible one?"], published: true },
  { id: "SP2-02", part: 2, title: "Part 2 — A memorable place", cueCard: "Describe a place you visited that you remember well. You should say where it was, when you went there, what you did, and explain why you remember it.", published: true },
  { id: "SP3-02", part: 3, title: "Part 3 — Places and communities", questions: ["Why do some places attract more visitors than others?", "How can tourism affect local communities?", "What can cities do to make public spaces more attractive?"], published: true }
];
