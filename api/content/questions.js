import { adminDb } from "../_lib/firebase-admin.js";

function clean(value) {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed." });

  try {
    const { skill, section, testId, type, difficulty, limit = "100" } = req.query || {};
    let ref = adminDb.collection("questions");
    const filters = [
      ["published", "==", true],
      ["skill", "==", clean(skill)?.toLowerCase()],
      ["section", "==", section ? Number(section) : undefined],
      ["testId", "==", clean(testId)],
      ["type", "==", clean(type)],
      ["difficulty", "==", clean(difficulty)]
    ];

    for (const [field, op, value] of filters) {
      if (value !== undefined) ref = ref.where(field, op, value);
    }

    const max = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const snap = await ref.limit(max).get();
    const questions = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));

    return res.status(200).json({ questions });
  } catch (error) {
    console.error("questions api error", error);
    return res.status(500).json({ message: "Unable to load the question bank." });
  }
}
