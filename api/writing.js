import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../lib/server/firebase-admin.js";
import { requireSession } from "../lib/server/session.js";
import { rateLimit } from "../lib/server/rate-limit.js";

const EVAL_MODEL = process.env.XAI_EVAL_MODEL || "grok-4.5";
const MAX_TEXT_CHARS = 20000;

function clampBand(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(9, Math.round(n * 2) / 2)) : 0;
}

function extractJson(text) {
  const raw = String(text || "").trim();
  try { return JSON.parse(raw); } catch {}
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("AI evaluator returned invalid JSON.");
  return JSON.parse(m[0]);
}

async function evaluateWriting({ taskType, testType, prompt, text, wordCount, minimumWords }) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY is not configured.");

  // Task 1 is scored on Task Achievement, Task 2 on Task Response — same
  // JSON key ("taskResponse") either way so the frontend/storage schema
  // stays uniform; the label difference is handled in the prompt only.
  const taskCriterionLabel = taskType === 2 ? "Task Response" : "Task Achievement";
  const system = `You are an IELTS Writing practice evaluator. This is an educational estimate, NOT an official IELTS score. Evaluate the candidate's response against the four IELTS Writing criteria for ${testType === "general" ? "General Training" : "Academic"} Writing Task ${taskType}: ${taskCriterionLabel}, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. Use the public IELTS assessment framework as reference, but do not reproduce copyrighted band-descriptor text. Consider how fully and accurately the response addresses the task/prompt, paragraphing and logical organisation, use of cohesive devices, range and precision of vocabulary, and range/accuracy of grammar. A response under the minimum word count should generally be capped on the task criterion. Return ONLY valid JSON in this exact shape: {"taskResponse":{"band":0,"feedback":"","evidence":[]},"coherenceCohesion":{"band":0,"feedback":"","evidence":[]},"lexicalResource":{"band":0,"feedback":"","evidence":[]},"grammar":{"band":0,"feedback":"","evidence":[]},"overallBand":0,"strengths":[],"improvements":[],"disclaimer":""}. Bands must be whole or half bands from 0 to 9.`;
  const input = `Test type: ${testType}\nWriting Task: ${taskType}\nPrompt: ${prompt}\nMinimum word count: ${minimumWords}\nCandidate word count: ${wordCount}\nCandidate response:\n${text}`;

  const r = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EVAL_MODEL,
      input: [
        { role: "system", content: [{ type: "input_text", text: system }] },
        { role: "user", content: [{ type: "input_text", text: input }] }
      ],
      reasoning: { effort: "none" }
    })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error?.message || "AI evaluation failed.");
  return extractJson(d.output_text || d.output?.map(x => x?.content?.map(c => c?.text || "").join("")).join(""));
}

export default async function handler(req, res) {
  const user = await requireSession(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const snap = await adminDb.collection("writing_submissions").where("uid", "==", user.uid).limit(50).get();
    const submissions = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return res.status(200).json({ submissions });
  }

  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed." });
  // Lower limit than a plain save, since each request now costs an OpenAI call.
  if (!(await rateLimit(req, res, { key: "writing-submit", limit: 15 }))) return;

  const { taskId = null, taskType = 1, testType = "academic", prompt = "", text = "", minimumWords = 0 } = req.body || {};
  const trimmed = String(text || "").trim();
  if (!trimmed) return res.status(400).json({ message: "Write a response before submitting." });

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const requiredWords = Number(minimumWords) || 0;
  const meetsMinimumWords = requiredWords ? wordCount >= requiredWords : true;
  const normalizedTaskType = Number(taskType) === 2 ? 2 : 1;
  const normalizedTestType = testType === "general" ? "general" : "academic";
  const promptText = String(prompt || "").slice(0, 4000);
  const textToSave = trimmed.slice(0, MAX_TEXT_CHARS);

  let result = null;
  let evaluationError = null;
  try {
    const e = await evaluateWriting({
      taskType: normalizedTaskType,
      testType: normalizedTestType,
      prompt: promptText,
      text: textToSave,
      wordCount,
      minimumWords: requiredWords
    });
    result = {
      taskResponse: { band: clampBand(e.taskResponse?.band), feedback: String(e.taskResponse?.feedback || ""), evidence: Array.isArray(e.taskResponse?.evidence) ? e.taskResponse.evidence : [] },
      coherenceCohesion: { band: clampBand(e.coherenceCohesion?.band), feedback: String(e.coherenceCohesion?.feedback || ""), evidence: Array.isArray(e.coherenceCohesion?.evidence) ? e.coherenceCohesion.evidence : [] },
      lexicalResource: { band: clampBand(e.lexicalResource?.band), feedback: String(e.lexicalResource?.feedback || ""), evidence: Array.isArray(e.lexicalResource?.evidence) ? e.lexicalResource.evidence : [] },
      grammar: { band: clampBand(e.grammar?.band), feedback: String(e.grammar?.feedback || ""), evidence: Array.isArray(e.grammar?.evidence) ? e.grammar.evidence : [] },
      overallBand: clampBand(e.overallBand),
      strengths: Array.isArray(e.strengths) ? e.strengths.slice(0, 8) : [],
      improvements: Array.isArray(e.improvements) ? e.improvements.slice(0, 8) : [],
      disclaimer: String(e.disclaimer || "AI estimate for practice only; not an official IELTS result.")
    };
  } catch (err) {
    console.error("writing evaluation error", err);
    evaluationError = err.message || "Unable to evaluate this response right now.";
  }

  const submission = {
    uid: user.uid,
    taskId,
    taskType: normalizedTaskType,
    testType: normalizedTestType,
    prompt: promptText,
    text: textToSave,
    wordCount,
    minimumWords: requiredWords,
    meetsMinimumWords,
    status: result ? "evaluated" : "submitted",
    result,
    model: result ? EVAL_MODEL : null,
    createdAt: FieldValue.serverTimestamp()
  };

  const ref = await adminDb.collection("writing_submissions").add(submission);

  if (!result) {
    // Response is safely saved even if the AI call failed (quota, outage, etc.)
    // so the learner never loses their work.
    return res.status(201).json({
      id: ref.id,
      wordCount,
      meetsMinimumWords,
      message: `Response saved, but evaluation failed: ${evaluationError}`
    });
  }

  return res.status(201).json({
    id: ref.id,
    wordCount,
    meetsMinimumWords,
    ...result
  });
}
