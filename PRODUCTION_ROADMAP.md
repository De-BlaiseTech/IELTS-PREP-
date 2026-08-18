# IELTS Prep CBT — Production Roadmap

## Production standard

The question bank must be **original IELTS-style content**, not copied official IELTS questions. It must follow the current IELTS structure and question conventions published by IELTS.org.

### Listening
- 4 parts, 40 questions per complete test.
- Parts 1–2: everyday/social contexts.
- Parts 3–4: education/training contexts.
- Recordings are heard once.
- Store audio, transcript, questions, answer key, word limits and section metadata.
- Use varied English accents for practice content where production audio is available.

### Reading
- Academic: 3 passages, 40 questions, 60 minutes.
- General Training: 3 sections, 40 questions, 60 minutes.
- Passage/question groups must be stored together so questions can be generated and reviewed as a coherent test.

### Writing
- Academic: Task 1 + Task 2.
- General Training: Task 1 + Task 2.
- Store task type, prompt, minimum word count, evaluation criteria and model planning guidance where licensed/original.

### Speaking
- Part 1, Part 2 cue card, Part 3.
- Store topic, examiner prompt, follow-ups, timing and evaluation metadata.
- Speaking evaluation uses the four IELTS criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.

## Question-bank target

The production target is **2,000+ original items/tasks**, but item count must never be achieved by duplicating templates or recycling the same question. Each question must pass automated validation and human/content review before `published: true`.

Suggested initial allocation:
- 800+ Listening questions
- 800+ Reading questions
- 200+ Writing tasks
- 250+ Speaking prompts/questions

## Firestore collections

- `tests`
- `questions`
- `reading_passages`
- `listening_sections`
- `writing_tasks`
- `speaking_prompts`
- `attempts`
- `speaking_evaluations`

Keep the browser unable to read the question bank directly. Vercel server endpoints using Firebase Admin remain the content gate.

## AI Speaking evaluation

Required Vercel environment variables:

- `OPENAI_API_KEY`
- `OPENAI_EVAL_MODEL` (optional; defaults to `gpt-5.6`)
- `OPENAI_TRANSCRIBE_MODEL` (optional; defaults to `gpt-4o-mini-transcribe`)

The endpoint `/api/speaking/evaluate` accepts either a transcript or a short base64 audio recording. Audio is transcribed server-side, then evaluated against the four IELTS speaking criteria. The result is explicitly an **AI practice estimate**, not an official IELTS score.

### Pronunciation limitation in this first production layer

Transcript-only evaluation cannot reliably measure pronunciation. The endpoint therefore marks pronunciation confidence as limited. A later acoustic layer should analyze intelligibility, stress, rhythm, intonation and segmental errors before using pronunciation feedback as a stronger signal.

Never expose `OPENAI_API_KEY` to browser JavaScript.

## Publishing workflow

1. Generate original content.
2. Validate schema.
3. Review for IELTS-format compliance.
4. Review answer keys and explanations.
5. Produce/listen-check audio and verify transcripts.
6. Mark `published: true` only after review.
7. Seed Firestore in batches.
8. Run a smoke test on Practice, Mock Tests, Writing and Speaking.
