import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { questionBankTests, questionBankQuestions, writingTasks, speakingPrompts } from "../src/data/questionBank.js";
import { adminDb } from "./_lib/firebase-admin.js";

function isAuthorized(req) {
  const configured = process.env.SEED_SECRET;
  if (!configured) return false;
  const supplied = req.headers["x-seed-secret"] || req.body?.secret || "";
  return supplied === configured;
}

async function batchUpsert(collection, items) {
  for (let i = 0; i < items.length; i += 400) {
    const batch = adminDb.batch();
    const slice = items.slice(i, i + 400);
    for (const item of slice) {
      const { id, ...data } = item;
      if (!id) throw new Error(`Missing id in ${collection} item.`);
      batch.set(adminDb.collection(collection).doc(id), {
        ...data,
        published: data.published !== false,
        questionBankVersion: 2,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Use POST." });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }

  try {
    await batchUpsert("tests", questionBankTests);
    await batchUpsert("questions", questionBankQuestions);
    await batchUpsert("writing_tasks", writingTasks);
    await batchUpsert("speaking_prompts", speakingPrompts);

    return res.status(200).json({
      ok: true,
      message: "Question bank seeded successfully.",
      counts: {
        tests: questionBankTests.length,
        questions: questionBankQuestions.length,
        writingTasks: writingTasks.length,
        speakingPrompts: speakingPrompts.length
      }
    });
  } catch (error) {
    console.error("Seed failed:", error);
    return res.status(500).json({ ok: false, error: "Seed failed. Check the Vercel function logs." });
  }
}
