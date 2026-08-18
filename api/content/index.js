import { adminDb } from "../_lib/firebase-admin.js";

async function readCollection(name) {
  const snap = await adminDb.collection(name).where("published", "==", true).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed." });
  try {
    const [tests, questions, writingTasks, speaking] = await Promise.all([
      readCollection("tests"),
      readCollection("questions"),
      readCollection("writing_tasks"),
      readCollection("speaking_prompts")
    ]);
    return res.status(200).json({ tests, questions, writingTasks, speaking });
  } catch (error) {
    console.error("content api error", error);
    return res.status(500).json({ message: "Unable to load IELTS content from Firestore." });
  }
}
