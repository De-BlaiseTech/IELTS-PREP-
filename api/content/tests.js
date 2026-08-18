import { adminDb } from "../_lib/firebase-admin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed." });
  try {
    const snap = await adminDb.collection("tests").where("published", "==", true).get();
    const tests = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return res.status(200).json({ tests });
  } catch (error) {
    console.error("tests api error", error);
    return res.status(500).json({ message: "Unable to load tests." });
  }
}
