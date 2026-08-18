import { adminDb } from "./firebase-admin.js";

// Fixed-window rate limiter backed by Firestore so the limit holds across
// separate serverless invocations (an in-memory counter would not).
// Fails OPEN on internal errors: a rate-limiter outage should never be able
// to lock every user out of login/register.

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(first || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

/**
 * @param {string} key        Logical bucket name, e.g. "login".
 * @param {number} limit      Max requests allowed per window.
 * @param {number} windowMs   Window length in milliseconds (default 15 min).
 * @returns {Promise<boolean>} true if the request is allowed to proceed.
 */
export async function rateLimit(req, res, { key, limit = 10, windowMs = 15 * 60 * 1000 }) {
  const ip = clientIp(req);
  const id = `${key}__${ip}`;
  const ref = adminDb.collection("rateLimits").doc(id);
  const now = Date.now();

  try {
    const allowed = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : null;

      if (!data || now - data.windowStart > windowMs) {
        tx.set(ref, { windowStart: now, count: 1 });
        return true;
      }
      if (data.count >= limit) return false;
      tx.update(ref, { count: data.count + 1 });
      return true;
    });

    if (!allowed) {
      res.status(429).json({ message: "Too many requests. Please try again in a few minutes." });
      return false;
    }
    return true;
  } catch (error) {
    console.error("rate limit error", error);
    return true; // fail open
  }
}
