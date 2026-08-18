// Custom authentication API client.
// Brevo API keys and Firebase Admin credentials stay on Vercel only.

export const AUTH_API_BASE = "";

async function post(path, body) {
  const r = await fetch(`${AUTH_API_BASE}${path}`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    credentials: "include",
    body: JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || "Request failed.");
  return data;
}

export const register = (name,email,password) =>
  post("/api/auth",{action:"register",name,email,password});

export const resendVerification = (email) =>
  post("/api/auth",{action:"resendVerification",email});

export const login = (email,password) =>
  post("/api/auth",{action:"login",email,password});

export const logout = () => post("/api/auth",{action:"logout"});

export const forgotPassword = (email) =>
  post("/api/auth",{action:"forgotPassword",email});

export const resetPassword = (token,password) =>
  post("/api/auth",{action:"resetPassword",token,password});

export const verifyEmail = (token) =>
  post("/api/auth",{action:"verifyEmail",token});
