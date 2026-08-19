import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { questionBankTests, questionBankQuestions, writingTasks, speakingPrompts } from "../content/question-bank.js";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON.");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(raw);
} catch {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  process.exit(1);
}

const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function batchUpsert(collection, items) {
  for (let i = 0; i < items.length; i += 400) {
    const batch = db.batch();
    const slice = items.slice(i, i + 400);
    for (const item of slice) {
      const { id, ...data } = item;
      if (!id) throw new Error(`Missing id in ${collection} item.`);
      batch.set(db.collection(collection).doc(id), {
        ...data,
        published: data.published !== false,
        questionBankVersion: 4,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
  }
}

await batchUpsert("tests", questionBankTests);
await batchUpsert("questions", questionBankQuestions);
await batchUpsert("writing_tasks", writingTasks);
await batchUpsert("speaking_prompts", speakingPrompts);

console.log(`Seed complete: ${questionBankTests.length} tests, ${questionBankQuestions.length} questions, ${writingTasks.length} writing tasks, ${speakingPrompts.length} speaking prompt sets.`);
