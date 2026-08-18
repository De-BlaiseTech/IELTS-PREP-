import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../lib/server/firebase-admin.js';
import { requireSession } from '../lib/server/session.js';

const normalize = (v) => String(v ?? '').trim().toLowerCase();

function band(skill, correct) {
  const maps = {
    listening: [[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[27,6.5],[23,6],[18,5.5],[16,5],[13,4.5],[10,4]],
    reading: [[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4]]
  };
  const map = maps[skill] || [];
  for (const [min, value] of map) if (correct >= min) return value;
  return Math.max(3, Math.round((correct / 40) * 18) / 2);
}

function overall(values) {
  const valid = values.filter(v => typeof v === 'number' && v > 0);
  if (!valid.length) return 0;
  return Math.round((valid.reduce((a,b)=>a+b,0) / valid.length) * 2) / 2;
}

export default async function handler(req, res) {
  const user = await requireSession(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      const snap = await adminDb.collection('attempts').where('uid','==',user.uid).limit(50).get();
      const attempts = snap.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      return res.status(200).json({ attempts });
    }
    if (req.method !== 'POST') return res.status(405).json({ message:'Method not allowed.' });

    const { type='practice', skill, testId=null, answers={} } = req.body || {};
    const ids = Object.keys(answers).slice(0, 200);
    if (!ids.length) return res.status(400).json({ message:'No answers were submitted.' });

    const questions = [];
    for (let i=0; i<ids.length; i+=30) {
      const chunk = ids.slice(i,i+30);
      const snap = await adminDb.collection('questions').where('__name__','in',chunk).get();
      snap.docs.forEach(d => questions.push({id:d.id,...d.data()}));
    }
    const graded = questions.filter(q => q.skill === 'listening' || q.skill === 'reading');
    const bySkill = {};
    for (const q of graded) {
      const correct = normalize(answers[q.id]) === normalize(q.answer) || (Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.some(a => normalize(a) === normalize(answers[q.id])));
      if (!bySkill[q.skill]) bySkill[q.skill] = { correct:0, total:0 };
      bySkill[q.skill].total += 1;
      if (correct) bySkill[q.skill].correct += 1;
    }
    const skills = {};
    for (const [key, value] of Object.entries(bySkill)) skills[key] = { ...value, band: band(key, value.correct) };
    const overallBand = overall(Object.values(skills).map(v => v.band));
    const attempt = {
      uid:user.uid, type, testId, skill:skill || null, overall:overallBand, skills,
      questionCount: ids.length, createdAt: FieldValue.serverTimestamp()
    };
    const ref = await adminDb.collection('attempts').add(attempt);
    return res.status(201).json({ id:ref.id, ...attempt, createdAt:new Date().toISOString() });
  } catch (error) {
    console.error('attempts api error', error);
    return res.status(500).json({ message:'Unable to save the attempt.' });
  }
}
