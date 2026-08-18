import { questionBankTests, questionBankQuestions, writingTasks, speakingPrompts } from '../src/data/questionBank.js';
const errors=[];
const allowedSkills=new Set(['listening','reading']);
const allowedTypes=new Set(['multiple_choice','true_false_not_given','yes_no_not_given','matching_headings','matching_information','matching_features','matching_sentence_endings','sentence_completion','summary_completion','note_completion','table_completion','flow_chart_completion','diagram_label_completion','short_answer']);
function required(item,fields,label){for(const field of fields){if(item[field]===undefined||item[field]===null||item[field]==='')errors.push(`${label}: missing ${field}`)}}
for(const t of questionBankTests)required(t,['id','title'],`test ${t.id||'?'}`);
for(const q of questionBankQuestions){required(q,['id','testId','skill','section','number','type','prompt'],`question ${q.id||'?'}`);if(!allowedSkills.has(q.skill))errors.push(`question ${q.id}: invalid skill`);if(!allowedTypes.has(q.type))errors.push(`question ${q.id}: unsupported type ${q.type}`);if(q.type==='multiple_choice'&&(!Array.isArray(q.options)||q.options.length<3))errors.push(`question ${q.id}: multiple choice needs options`);if(q.answer===undefined||q.answer===null||q.answer==='')errors.push(`question ${q.id}: missing answer`)}
for(const t of writingTasks)required(t,['id','testType','task','prompt','minimumWords'],`writing task ${t.id||'?'}`);
for(const s of speakingPrompts)required(s,['id','part','title'],`speaking prompt ${s.id||'?'}`);
const seen=new Set();for(const q of questionBankQuestions){if(seen.has(q.id))errors.push(`duplicate question id ${q.id}`);seen.add(q.id)}
if(errors.length){console.error(`Validation failed with ${errors.length} issue(s):`);errors.slice(0,100).forEach(e=>console.error('- '+e));process.exit(1)}
console.log(`Content validation passed: ${questionBankTests.length} tests, ${questionBankQuestions.length} objective questions, ${writingTasks.length} writing tasks, ${speakingPrompts.length} speaking prompt sets.`);
