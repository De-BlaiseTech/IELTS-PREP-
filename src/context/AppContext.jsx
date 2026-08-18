import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { observeAuth } from "../services/auth";
import { demoTests, demoQuestions, demoWritingTasks, demoSpeaking } from "../data/demo";

const Context = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [targetBand, setTargetBand] = useState(() => Number(localStorage.getItem("ielts-target-band") || 7.5));
  const [attempts, setAttempts] = useState(() => JSON.parse(localStorage.getItem("ielts-attempts") || "[]"));
  const [content, setContent] = useState({ tests: [], questions: [], writingTasks: [], speaking: [] });
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState("");

  useEffect(() => observeAuth(setUser), []);

  useEffect(() => {
    let cancelled = false;
    async function loadContent() {
      setContentLoading(true);
      setContentError("");
      try {
        const response = await fetch("/api/content");
        if (!response.ok) throw new Error("Content API unavailable");
        const data = await response.json();
        if (!cancelled) setContent({
          tests: data.tests || [],
          questions: data.questions || [],
          writingTasks: data.writingTasks || [],
          speaking: data.speaking || []
        });
      } catch (error) {
        // Keep the app usable during local development before Firestore is seeded.
        if (!cancelled) {
          setContent({
            tests: demoTests,
            questions: demoQuestions,
            writingTasks: demoWritingTasks,
            speaking: demoSpeaking
          });
          setContentError("Firestore content is not available yet; showing local sample content.");
        }
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    }
    loadContent();
    return () => { cancelled = true; };
  }, []);

  function updateTargetBand(value) {
    setTargetBand(Number(value));
    localStorage.setItem("ielts-target-band", value);
  }

  function saveLocalAttempt(attempt) {
    const next = [{ ...attempt, createdAt: new Date().toISOString() }, ...attempts];
    setAttempts(next);
    localStorage.setItem("ielts-attempts", JSON.stringify(next));
  }

  const value = useMemo(() => ({
    user, setUser, targetBand, updateTargetBand, attempts, saveLocalAttempt,
    ...content, contentLoading, contentError
  }), [user, targetBand, attempts, content, contentLoading, contentError]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useApp = () => useContext(Context);
