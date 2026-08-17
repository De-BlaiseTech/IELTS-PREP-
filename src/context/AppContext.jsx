import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { observeAuth } from "../services/auth";
import { demoTests, demoQuestions, demoWritingTasks, demoSpeaking } from "../data/demo";

const Context = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [targetBand, setTargetBand] = useState(() => Number(localStorage.getItem("ielts-target-band") || 7.5));
  const [attempts, setAttempts] = useState(() => JSON.parse(localStorage.getItem("ielts-attempts") || "[]"));

  useEffect(() => observeAuth(setUser), []);

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
    tests: demoTests, questions: demoQuestions, writingTasks: demoWritingTasks, speaking: demoSpeaking
  }), [user, targetBand, attempts]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useApp = () => useContext(Context);
