import React from "react";

export default function QuestionCard({ question, value, onChange }) {
  const isText = ["short_answer", "sentence_completion", "summary_completion"].includes(question.type);
  return (
    <div className="question-card">
      <div className="question-number">Question {question.number}</div>
      {question.passage && <div className="mini-passage">{question.passage}</div>}
      <h3>{question.prompt}</h3>
      {isText ? (
        <input className="answer-input" value={value || ""} onChange={e => onChange(e.target.value)} placeholder="Type your answer..." />
      ) : (
        <div className="options">
          {(question.options || []).map(option => (
            <label className={`option ${value === option ? "selected" : ""}`} key={option}>
              <input type="radio" name={question.id} checked={value === option} onChange={() => onChange(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
