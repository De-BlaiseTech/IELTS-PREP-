import { register as apiRegister, resendVerification, login as apiLogin, logout as apiLogout, forgotPassword } from "./auth-api.js";
const state={
 page:"dashboard", user:null, target:Number(localStorage.getItem("ielts-target")||7.5),
 attempts:JSON.parse(localStorage.getItem("ielts-attempts")||"[]"), answers:{}, submitted:false,
 type:"academic", testId:null, examAnswers:{}, stage:0, writingTask:1, writingText:"", speakingPart:1, recording:false, speakingLive:false, speakingLiveStatus:"", timer:null
};
let questions=[]; let tests=[]; let contentReady=false; let contentError="";
const SPEAKING_PARTS=[
  {n:1,title:"Part 1 — Introduction and Interview",qs:["Where do you currently live?","What do you enjoy doing in your free time?","Do you prefer studying alone or with other people?"]},
  {n:2,title:"Part 2 — Long Turn",cue:"Describe a useful skill you would like to learn. You should say what the skill is, why you would like to learn it, how you would learn it, and explain how it could help you."},
  {n:3,title:"Part 3 — Discussion",qs:["Why do some skills become more valuable as technology changes?","Should schools teach more practical skills?","How might learning methods change in the future?"]}
];
function blobToBase64(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onloadend=()=>resolve(String(reader.result).split(",")[1]||"");reader.onerror=reject;reader.readAsDataURL(blob)})}
function mapQuestion(q){
  const supported=["multiple_choice","true_false_not_given","yes_no_not_given","matching_headings","matching_information","matching_features","matching_sentence_endings"];
  return {...q, type:supported.includes(q.type)?"mc":"text", ex:q.explanation||q.ex||""};
}
let globalLoadingCount=0;
function ensureGlobalLoader(){
  let el=document.getElementById("global-loader");
  if(el) return el;
  el=document.createElement("div");
  el.id="global-loader";
  el.className="global-loader hidden";
  el.innerHTML='<div class="loader-card" role="status" aria-live="polite"><span class="spinner"></span><div><b id="loader-title">Please wait…</b><small id="loader-message">Loading</small></div></div>';
  document.body.appendChild(el);
  return el;
}
function setGlobalLoading(active,title="Please wait…",message="Loading"){
  const el=ensureGlobalLoader();
  if(active){
    globalLoadingCount++;
    document.getElementById("loader-title").textContent=title;
    document.getElementById("loader-message").textContent=message;
    el.classList.remove("hidden");
  }else{
    globalLoadingCount=Math.max(0,globalLoadingCount-1);
    if(globalLoadingCount===0) el.classList.add("hidden");
  }
}
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(...args){
  const url=String(args[0]||"");
  const isAppRequest=url.startsWith("/") && !url.startsWith("//");
  if(isAppRequest) setGlobalLoading(true,"Please wait…","Connecting securely");
  try{return await nativeFetch(...args);}
  finally{if(isAppRequest)setGlobalLoading(false);}
}

async function loadFirestoreContent(){
  try{const r=await fetch("/api/content",{credentials:"include"}); if(!r.ok) throw new Error("Firestore content could not be loaded."); const d=await r.json();
    questions=(d.questions||[]).map(mapQuestion).sort((a,b)=>(Number(a.number)||0)-(Number(b.number)||0)); tests=d.tests||[]; contentReady=true; contentError="";
  }catch(e){contentReady=false; contentError=e.message||"Unable to load Firestore question bank.";} render();
}
function save(){localStorage.setItem("ielts-attempts",JSON.stringify(state.attempts))}
function nav(p){state.page=p;state.submitted=false;state.answers={};state.lastWritingResult=null;state.lastSpeakingResult=null;closeMenu();render()}
function addAttempt(a){state.attempts.unshift({...a,date:new Date().toLocaleDateString()});save()}
function overall(vals){let a=vals.filter(v=>typeof v==="number"&&v>0);return a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*2)/2:0}
function latestSkillBand(skill){const found=state.attempts.find(a=>String(a.skill||"").toLowerCase()===skill);return typeof found?.overall==="number"&&found.overall>0?found.overall:null}
async function submitAttempt(type,skill,testId,answers){
  const r=await fetch("/api/attempts",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,skill,testId,answers})});
  const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.message||"Unable to save the attempt.");
  return d;
}
async function fetchAttempts(){
  try{
    const r=await fetch("/api/attempts",{credentials:"include"}); if(!r.ok) return;
    const d=await r.json().catch(()=>({}));
    if(Array.isArray(d.attempts)&&d.attempts.length){
      state.attempts=d.attempts.map(a=>({...a,date:a.date||(a.createdAt?new Date(a.createdAt).toLocaleDateString():"")}));
      save();
    }
  }catch(e){/* keep local cache on failure */}
}
function layout(inner){
  const navItems=[['dashboard','⌂ Dashboard'],['practice','▶ Practice'],['mock','▣ Mock Tests'],['listening','🎧 Listening'],['reading','📖 Reading'],['writing','✍ Writing'],['speaking','🎤 Speaking'],['progress','▥ Progress'],['profile','◉ Profile']];
  const navButtons=navItems.map(x=>`<button class="${state.page===x[0]?'active':''}" onclick="nav('${x[0]}')">${x[1]}</button>`).join("");
  return `<div class="shell">
    <aside class="sidebar" id="side">
      <div class="brand"><div class="logo">I</div><div><b>IELTS Prep</b><small>CBT Practice</small></div></div>
      <div class="nav">${navButtons}</div>
      <button class="signout" onclick="doLogout()">↪ Sign out</button>
    </aside>
    <main class="main">
      <header class="top">
        <button class="mobile-menu" aria-label="Open navigation" onclick="toggleMenu()">☰</button>
        <b>IELTS Practice Centre</b>
        <div class="avatar">${(state.user||"S").slice(0,1).toUpperCase()}</div>
      </header>
      <div class="mobile-nav hidden" id="mobileNav">
        <div class="mobile-nav-inner">
          ${navButtons}
          <button class="mobile-signout" onclick="doLogout()">↪ Sign out</button>
        </div>
      </div>
      <div class="content">${inner}</div>
    </main>
  </div>`;
}
function render(){if(!state.user&&state.page!=="login"&&state.page!=="register")state.page="login";const pages={dashboard,practice,mock,listening:()=>skillPage("listening"),reading:()=>skillPage("reading"),writing,speaking,progress,profile,exam,login,register};document.getElementById("app").innerHTML=(pages[state.page]||dashboard)();bind();ensureGlobalLoader()}
function toggleMenu(){document.getElementById("mobileNav")?.classList.toggle("hidden")} function closeMenu(){document.getElementById("mobileNav")?.classList.add("hidden")}
function dashboard(){let latest=state.attempts[0];return layout(`<section class="hero"><div><div class="eyebrow">YOUR PREPARATION HUB</div><h1>Welcome back, ${state.user}.</h1><p>Your questions, tests and results are now powered by Firestore.</p></div><button class="btn primary" onclick="nav('mock')">Take a mock test →</button></section><div class="cards"><div class="card stat"><span>Current estimate</span><strong>${latest?.overall||"—"}</strong><small>Latest saved attempt</small></div><div class="card stat"><span>Target band</span><strong>${state.target}</strong><small>Your preparation target</small></div><div class="card stat"><span>Attempts</span><strong>${state.attempts.length}</strong><small>Local display + Firestore</small></div><div class="card stat"><span>Question bank</span><strong>${questions.length||"—"}</strong><small>Published Firestore questions</small></div></div><section class="section"><div class="heading"><div><div class="eyebrow">SKILLS</div><h2>Your IELTS skills</h2></div><button class="btn secondary" onclick="nav('progress')">View progress</button></div><div class="skill-grid">${[['Listening','🎧','listening'],['Reading','📖','reading'],['Writing','✍','writing'],['Speaking','🎤','speaking']].map(s=>{const band=latestSkillBand(s[2]);return `<button class="skill" onclick="nav('${s[2]}')"><span class="ico">${s[1]}</span><span class="skill-main"><b>${s[0]}</b><span class="bar"><i style="width:${band?Math.round(band/9*100):0}%"></i></span><small>${band?`Latest band ${band}`:"No attempts yet"}</small></span>→</button>`}).join("")}</div></section>`)}
function practice(){return layout(`<div class="page-title"><div class="eyebrow">PRACTICE CENTRE</div><h1>Choose a skill</h1><p>Each objective question is retrieved from Firestore and graded by the backend.</p></div><div class="practice-grid">${[['Listening','🎧','Train with section-based questions and your Firestore question bank.','listening'],['Reading','📖','Practise passages, matching tasks and completion questions.','reading'],['Writing','✍','Work through Task 1 and Task 2 prompts.','writing'],['Speaking','🎤','Practise all three speaking parts.','speaking']].map(x=>`<button class="practice" onclick="nav('${x[3]}')"><span class="emoji">${x[1]}</span><h2>${x[0]}</h2><p>${x[2]}</p><b>Start practice →</b></button>`).join("")}</div>`)}
function currentTest(){return tests.find(t=>t.id===state.testId)||tests.find(t=>t.type===state.type)||tests[0]}
function mock(){if(!contentReady)return layout(`<div class="empty">${contentError||"Loading your Firestore question bank…"}<br><button class="btn secondary" onclick="loadFirestoreContent()">Retry</button></div>`);const available=tests.filter(t=>t.type===state.type);return layout(`<div class="page-title"><div class="eyebrow">FULL EXAMS</div><h1>Mock tests</h1><p>Choose a published Firestore test. Your objective answers are graded on the server.</p></div><div class="switch"><button class="${state.type==='academic'?'active':''}" onclick="state.type='academic';render()">Academic</button><button class="${state.type==='general'?'active':''}" onclick="state.type='general';render()">General Training</button></div>${available.map(t=>`<div class="test"><div class="test-body"><span class="tag">${t.type}</span><h2>${t.title}</h2><p>${t.description||t.desc||''}</p><span class="meta">⏱ ${t.duration||150} minutes · ${(t.skills||['Listening','Reading','Writing']).join(' · ')}</span></div><button class="btn primary" onclick="state.page='exam';state.testId='${t.id}';state.stage=0;state.answers={};state.examAnswers={};render()">Start →</button></div>`).join("")||'<div class="empty">No published tests found.</div>'}`)}
function timer(seconds,id){setTimeout(()=>{let el=document.getElementById(id);if(!el)return;let end=Date.now()+seconds*1000;function tick(){let r=Math.max(0,Math.floor((end-Date.now())/1000));el.textContent=`⏱ ${String(Math.floor(r/60)).padStart(2,"0")}:${String(r%60).padStart(2,"0")}`;if(r>0)setTimeout(tick,500)}tick()},0)}
function skillPage(skill){if(!contentReady)return layout(`<div class="empty">${contentError||"Loading your Firestore question bank…"}<br><button class="btn secondary" onclick="loadFirestoreContent()">Retry</button></div>`);let pool=questions.filter(q=>q.skill===skill);let test=currentTest();let qs=(test?.id?pool.filter(q=>q.testId===test.id):pool).slice(0,40);if(!qs.length)return layout(`<div class="empty">No published ${skill} questions are available yet.</div>`);let title=skill[0].toUpperCase()+skill.slice(1);let passage=qs.find(q=>q.passage)?.passage;return layout(`<div class="exam-head"><div><span class="tag">${title} Practice</span><h1>${test?.title||title}</h1><p>Loaded from Firestore · ${qs.length} questions</p></div><div class="timer" id="timer">⏱ 30:00</div></div>${skill==='listening'?`<div class="audio"><div><b>IELTS Listening audio</b><p>Original audio is generated securely with xAI TTS for each section. Choose a section, then press play.</p></div><div class="audio-controls">${[1,2,3,4].map(s=>`<button class="btn secondary" onclick="playListeningAudio('${test?.id||''}',${s})">▶ Section ${s}</button>`).join("")}</div><audio id="listeningPlayer" controls preload="none" style="width:100%;margin-top:12px"></audio></div>`:''}<div class="${skill==='reading'?'passage-layout':'exam-layout'}">${skill==='reading'&&passage?`<article class="passage"><h2>Reading passage</h2><p>${passage}</p></article>`:''}<main>${qs.map(q=>qhtml(q)).join("")}<button class="btn primary" onclick="submitSkill('${skill}')">${state.submitting?'Saving…':'Submit '+title+' practice'}</button>${state.submitted?`<div class="success">Saved. Band estimate: <b>${state.lastResult?.skills?.[skill]?.band||state.lastResult?.overall||'—'}</b></div>`:''}</main><aside class="side"><b>Questions</b><div class="nums">${qs.map(q=>`<span class="${state.answers[q.id]?'answered':''}">${q.number}</span>`).join("")}</div><button class="btn secondary" style="width:100%;margin-top:12px" onclick="nav('practice')">Exit practice</button></aside></div>`);setTimeout(()=>timer(1800,"timer"),0)}
async function playListeningAudio(testId, section){
  if(!testId){alert("Select a listening test first.");return;}
  try{
    setGlobalLoading(true,"Preparing listening audio…",`Generating Section ${section} audio`);
    const r=await fetch(`/api/listening-audio?testId=${encodeURIComponent(testId)}&section=${section}`,{credentials:"include"});
    if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.message||"Unable to load listening audio.");}
    const blob=await r.blob();
    const player=document.getElementById("listeningPlayer");
    if(player){
      if(window.__ieltsAudioUrl)URL.revokeObjectURL(window.__ieltsAudioUrl);
      window.__ieltsAudioUrl=URL.createObjectURL(blob);
      player.src=window.__ieltsAudioUrl; await player.play().catch(()=>{});
    }
  }catch(e){alert(e.message||"Unable to play listening audio.");}
  finally{setGlobalLoading(false);}
}
function qhtml(q){return `<div class="question"><div class="qnum">Question ${q.number}</div>${q.passage&&q.type!=="text"?`<details><summary>View passage excerpt</summary><p>${q.passage}</p></details>`:''}<h3>${q.prompt}</h3>${q.type==='text'?`<input class="answer" value="${String(state.answers[q.id]||'').replace(/"/g,'&quot;')}" oninput="state.answers['${q.id}']=this.value">`:`<div class="options">${(q.options||[]).map(o=>`<label class="option ${state.answers[q.id]===o?'selected':''}"><input type="radio" name="${q.id}" ${state.answers[q.id]===o?'checked':''} onchange="state.answers['${q.id}']='${String(o).replace(/'/g,"\\'")}';render()"> ${o}</label>`).join("")}</div>`}</div>`}
async function submitSkill(skill){try{state.submitting=true;render();const r=await submitAttempt("practice",skill,state.testId||null,state.answers);state.lastResult=r;state.submitting=false;state.submitted=true;addAttempt({skill,overall:r.skills?.[skill]?.band||r.overall,skills:r.skills,serverId:r.id});render()}catch(e){state.submitting=false;render();alert(e.message)}}
function exam(){if(!contentReady)return layout(`<div class="empty">${contentError||"Loading your Firestore question bank…"}<br><button class="btn secondary" onclick="loadFirestoreContent()">Retry</button></div>`);const test=currentTest(),stages=['Listening','Reading','Writing'];if(state.stage>=3){const r=state.examResult||{};return layout(`<div class="result"><div class="eyebrow" style="color:#b8c9d8">MOCK TEST COMPLETE</div><h1>Estimated overall band</h1><strong>${r.overall||'—'}</strong><p>Your result has been saved to Firestore.</p></div><div class="result-grid"><div class="card"><span class="muted">Listening</span><strong>${r.listening||'—'}</strong></div><div class="card"><span class="muted">Reading</span><strong>${r.reading||'—'}</strong></div></div><button class="btn primary" onclick="nav('progress')">View progress</button>`)}const skill=stages[state.stage].toLowerCase(),qs=questions.filter(q=>q.skill===skill&&q.testId===test?.id).slice(0,40);if(state.stage<2&&!qs.length)return layout(`<div class="empty">No published ${stages[state.stage]} questions are attached to this test.</div>`);return layout(`<div class="exam-head"><div><span class="tag">${test?.type||state.type}</span><h1>${stages[state.stage]}</h1><p>${test?.title||'Mock test'} · ${qs.length} questions</p></div><div class="timer" id="examTimer">⏱ ${state.stage===0?'30:00':'60:00'}</div></div><div class="stepper">${stages.map((s,i)=>`<div class="step ${i===state.stage?'active':''} ${i<state.stage?'complete':''}">${i+1}. ${s}</div>`).join('')}</div>${state.stage<2?`<div class="exam-layout"><main>${qs.map(q=>qhtml(q)).join('')}<button class="btn primary" onclick="nextStage()">${state.stage===1?'Continue to Writing':'Continue to Reading'}</button></main><aside class="side"><b>Exam sections</b><p>1. Listening</p><p>2. Reading</p><p>3. Writing</p><p class="muted">Objective answers are saved when submitted.</p></aside></div>`:`<div class="writing-prompt"><h2>Writing section</h2><p>Complete the Writing tasks in the Writing module. Finish this mock to save the combined objective result.</p><button class="btn primary" onclick="finishExam()">Finish mock test</button></div>`}`)}
async function nextStage(){const skill=state.stage===0?'listening':'reading';try{Object.assign(state.examAnswers,state.answers); const r=await submitAttempt('mock-section',skill,state.testId,state.answers);if(skill==='listening')state.examListening=r.skills?.listening?.band||0;if(skill==='reading')state.examReading=r.skills?.reading?.band||0;state.answers={};state.stage++;render()}catch(e){alert(e.message)}}
async function finishExam(){try{Object.assign(state.examAnswers,state.answers); const r=await submitAttempt('mock',null,state.testId,state.examAnswers);state.examResult={listening:state.examListening||r.skills?.listening?.band,reading:state.examReading||r.skills?.reading?.band,overall:overall([state.examListening,r.skills?.reading?.band])};addAttempt({skill:'mock test',overall:state.examResult.overall,serverId:r.id});state.stage=3;render()}catch(e){alert(e.message)}}
function writing(){let task=state.writingTask===1?{title:"Academic Writing Task 1",min:150,prompt:"The chart below compares the amount of time three groups of adults spent on selected forms of exercise in one week. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",visual:true}:{title:"Academic Writing Task 2",min:250,prompt:"Some people think schools should focus more on practical skills than academic subjects. To what extent do you agree or disagree?"};let words=state.writingText.trim()?state.writingText.trim().split(/\s+/).length:0;let result=state.lastWritingResult;return layout(`<div class="page-title"><div class="eyebrow">WRITING PRACTICE</div><h1>${task.title}</h1><p>Write under realistic time and word-count conditions.</p></div><div class="switch"><button class="${state.writingTask===1?'active':''}" onclick="state.writingTask=1;state.writingText='';state.lastWritingResult=null;render()">Task 1</button><button class="${state.writingTask===2?'active':''}" onclick="state.writingTask=2;state.writingText='';state.lastWritingResult=null;render()">Task 2</button></div><div class="writing-prompt"><span class="tag">PROMPT</span><h2>${task.prompt}</h2>${task.visual?'<div class="visual">Demo chart placeholder — replace with your licensed/owned visual.</div>':''}<b>Minimum: ${task.min} words</b></div><textarea class="editor" id="editor" placeholder="Write your answer here...">${state.writingText}</textarea><div class="write-foot"><span class="muted">Word count: <b id="wc">${words}</b></span><button class="btn primary" onclick="submitWriting()" ${state.writingEvaluating?'disabled':''}>${state.writingEvaluating?'Evaluating…':'Submit response'}</button></div>${state.submitted&&!result?`<div class="success">${state.writingSaveMessage||'Response saved.'}</div>`:''}${result?`<div class="success"><b>AI practice estimate — overall band ${result.overallBand}</b><p class="muted">${result.disclaimer||'Not an official IELTS score.'}</p><ul>${[['taskResponse',state.writingTask===2?'Task Response':'Task Achievement'],['coherenceCohesion','Coherence & Cohesion'],['lexicalResource','Lexical Resource'],['grammar','Grammatical Range & Accuracy']].map(([k,label])=>`<li><b>${label}</b>: ${result[k]?.band??'—'} — ${result[k]?.feedback||''}</li>`).join('')}</ul>${result.improvements?.length?`<p class="muted"><b>To improve:</b> ${result.improvements.join(' · ')}</p>`:''}</div>`:''}</div>`)}
async function submitWriting(){
  state.writingText=document.getElementById("editor").value;
  const task=state.writingTask===1?{title:"Academic Writing Task 1",min:150,prompt:"The chart below compares the amount of time three groups of adults spent on selected forms of exercise in one week. Summarise the information by selecting and reporting the main features, and make comparisons where relevant."}:{title:"Academic Writing Task 2",min:250,prompt:"Some people think schools should focus more on practical skills than academic subjects. To what extent do you agree or disagree?"};
  if(!state.writingText.trim()){alert("Write a response before submitting.");return}
  try{
    state.writingEvaluating=true;state.lastWritingResult=null;render();
    const r=await fetch("/api/writing",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({taskType:state.writingTask,testType:"academic",prompt:task.prompt,text:state.writingText,minimumWords:task.min})});
    const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.message||"Unable to save your response.");
    state.writingSaveMessage=d.message;
    if(typeof d.overallBand==="number"){
      state.lastWritingResult=d;
      addAttempt({skill:"writing",overall:d.overallBand,wordCount:d.wordCount,serverId:d.id});
    }
    state.submitted=true;
  }catch(e){alert(e.message)}
  state.writingEvaluating=false;render();
}

function speaking(){
  let p=SPEAKING_PARTS[state.speakingPart-1], result=state.lastSpeakingResult;
  return layout(`<div class="page-title"><div class="eyebrow">SPEAKING PRACTICE</div><h1>${p.title}</h1><p>Choose standard recording practice or enter <b>Live AI Examiner</b> for a real-time IELTS-style interview powered by Grok.</p></div>
  <div class="parts">${SPEAKING_PARTS.map(x=>`<button class="${state.speakingPart===x.n?'active':''}" onclick="if(!state.speakingLive){state.speakingPart=${x.n};state.lastSpeakingResult=null;render()}">Part ${x.n}</button>`).join("")}</div>
  <div class="speaking">
    ${p.cue?`<span class="tag">CUE CARD</span><h2>${p.cue}</h2><p class="muted">Preparation: 1 minute · Speaking: 1–2 minutes</p>`:`${p.qs.map((q,i)=>`<div class="squestion"><b>${i+1}</b><span>${q}</span></div>`).join("")}`}
    <div class="record">
      <button class="${state.recording?'stop':''}" onclick="toggleRecord()" ${state.speakingEvaluating||state.speakingLive?'disabled':''}>${state.recording?'■ Stop recording':state.speakingEvaluating?'Evaluating…':'🎙 Start recording'}</button>
      <button class="${state.speakingLive?'stop':''}" onclick="${state.speakingLive?'stopLiveSpeaking()':'startLiveSpeaking()'}" ${state.recording||state.speakingEvaluating?'disabled':''}>${state.speakingLive?'■ End live interview':'🤖 Live AI Examiner'}</button>
      <span class="muted">${state.speakingLive?state.speakingLiveStatus:state.recording?'Recording…':state.speakingEvaluating?'Transcribing and scoring your response…':'Ready'}</span>
    </div>
    ${state.speakingLive?`<div class="success"><b>Live examiner active</b><p class="muted">Grok is acting as your IELTS-style examiner. Speak naturally. The browser microphone audio is streamed using a short-lived xAI token; your permanent API key stays on Vercel.</p><div class="card"><b>Live transcript</b><p>${escapeHtml(window.liveSpeakingTranscript||'Listening…')}</p></div></div>`:''}
    ${result?`<div class="success"><b>AI practice estimate — overall band ${result.overallBand}</b><p class="muted">${result.disclaimer||'Not an official IELTS score.'}</p><p><b>Transcript:</b> ${escapeHtml(result.transcript||'')}</p><ul>${['fluencyCoherence','lexicalResource','grammar','pronunciation'].map(k=>`<li><b>${k}</b>: ${result[k]?.band??'—'} — ${result[k]?.feedback||''}</li>`).join('')}</ul></div>`:''}
  </div>`);
}
function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

let mediaRecorder=null,recordChunks=[];
async function toggleRecord(){
  if(state.recording){mediaRecorder?.stop();state.recording=false;render();return}
  try{
    let stream=await navigator.mediaDevices.getUserMedia({audio:true});
    mediaRecorder=new MediaRecorder(stream);recordChunks=[];
    mediaRecorder.ondataavailable=e=>recordChunks.push(e.data);
    mediaRecorder.onstop=async()=>{
      stream.getTracks().forEach(t=>t.stop());
      const p=SPEAKING_PARTS[state.speakingPart-1], prompt=p.cue||p.qs.join(" ");
      const blob=new Blob(recordChunks,{type:"audio/webm"});
      if(blob.size>4000000){alert("Recording is too large. Please keep it under 4 MB.");return}
      state.speakingEvaluating=true;state.lastSpeakingResult=null;render();
      try{
        const audioBase64=await blobToBase64(blob);
        const r=await fetch("/api/speaking/evaluate",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,part:state.speakingPart,audioBase64,mimeType:"audio/webm"})});
        const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.message||"Unable to evaluate your speaking response.");
        state.lastSpeakingResult=d; addAttempt({skill:"speaking",overall:d.overallBand,recorded:true,serverId:d.id});
      }catch(e){alert(e.message)}
      state.speakingEvaluating=false;render();
    };
    mediaRecorder.start();state.recording=true;render()
  }catch(e){alert("Microphone permission is required for speaking practice.")}
}

let liveWs=null,liveAudioContext=null,liveProcessor=null,liveStream=null,liveGain=null,liveNextPlayTime=0,liveTranscriptParts=[];
function floatToPcm16(input){const out=new Int16Array(input.length);for(let i=0;i<input.length;i++){const s=Math.max(-1,Math.min(1,input[i]));out[i]=s<0?s*0x8000:s*0x7fff}return out.buffer}
function arrayBufferToBase64(buffer){let bytes=new Uint8Array(buffer),binary='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(binary)}
function base64ToArrayBuffer(base64){const binary=atob(base64),out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out.buffer}
function playLivePcm(base64){
  if(!liveAudioContext)return;
  const pcm=new Int16Array(base64ToArrayBuffer(base64)); const buffer=liveAudioContext.createBuffer(1,pcm.length,24000), data=buffer.getChannelData(0);
  for(let i=0;i<pcm.length;i++)data[i]=pcm[i]/32768;
  const source=liveAudioContext.createBufferSource(); source.buffer=buffer; source.connect(liveAudioContext.destination);
  const start=Math.max(liveNextPlayTime,liveAudioContext.currentTime+0.02); source.start(start); liveNextPlayTime=start+buffer.duration;
}
async function startLiveSpeaking(){
  if(state.speakingLive)return;
  try{
    state.speakingLive=true;state.speakingLiveStatus="Connecting to Grok examiner…";window.liveSpeakingTranscript="";liveTranscriptParts=[];render();
    const tokenResponse=await fetch("/api/speaking/session",{method:"POST",credentials:"include"});
    const tokenData=await tokenResponse.json().catch(()=>({})); if(!tokenResponse.ok) throw new Error(tokenData.message||"Unable to create the live speaking session.");
    liveStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    liveAudioContext=new AudioContext({sampleRate:24000}); await liveAudioContext.resume();
    const source=liveAudioContext.createMediaStreamSource(liveStream);
    liveProcessor=liveAudioContext.createScriptProcessor(4096,1,1); liveGain=liveAudioContext.createGain(); liveGain.gain.value=0;
    source.connect(liveProcessor); liveProcessor.connect(liveGain); liveGain.connect(liveAudioContext.destination);
    liveWs=new WebSocket("wss://api.x.ai/v1/realtime?model=grok-voice-latest",[`xai-client-secret.${tokenData.token}`]);
    liveWs.binaryType="arraybuffer";
    liveWs.onopen=()=>{
      const p=SPEAKING_PARTS[state.speakingPart-1], prompt=p.cue||p.qs.join(" ");
      const instructions=`You are an IELTS Speaking examiner conducting an educational practice interview. This is not an official IELTS examination. Follow IELTS Speaking Part ${state.speakingPart} conventions. Ask one question at a time, listen carefully, do not coach the candidate during the interview, and keep the interaction natural. For Part 1 ask several short questions. For Part 2 introduce the cue card, give the candidate preparation guidance and then let them speak for the long turn; do not interrupt unnecessarily. For Part 3 ask analytical follow-up questions. At the end, thank the candidate and say the interview is complete. Candidate task: ${prompt}`;
      liveWs.send(JSON.stringify({type:"session.update",session:{voice:"eve",instructions,turn_detection:{type:"server_vad"},reasoning:{effort:"none"},audio:{input:{format:{type:"audio/pcm",rate:24000,transcription:{model:"grok-transcribe",language_hint:"en"}}},output:{format:{type:"audio/pcm",rate:24000}}}}}));
      liveWs.send(JSON.stringify({type:"conversation.item.create",item:{type:"message",role:"user",content:[{type:"input_text",text:`Begin the IELTS Speaking Part ${state.speakingPart} interview now. Start with the examiner's first instruction or question.`}]}}));
      liveWs.send(JSON.stringify({type:"response.create"}));
      state.speakingLiveStatus="Live examiner connected — speak when prompted.";render();
    };
    liveWs.onmessage=(event)=>{
      if(typeof event.data!=="string")return;
      let e;try{e=JSON.parse(event.data)}catch{return}
      if(e.type==="response.output_audio.delta"&&e.delta)playLivePcm(e.delta);
      if(e.type==="conversation.item.input_audio_transcription.updated"&&e.transcript){window.liveSpeakingTranscript=e.transcript;render()}
      if(e.type==="conversation.item.input_audio_transcription.completed"&&e.transcript){window.liveSpeakingTranscript=e.transcript;liveTranscriptParts.push(e.transcript);render()}
      if(e.type==="error"){state.speakingLiveStatus=e.error?.message||"Live examiner error.";render()}
    };
    liveWs.onerror=()=>{state.speakingLiveStatus="The live examiner connection failed.";render()};
    liveWs.onclose=()=>{if(state.speakingLive){state.speakingLive=false;state.speakingLiveStatus="Live session ended.";render()}};
    liveProcessor.onaudioprocess=e=>{
      if(liveWs?.readyState!==WebSocket.OPEN)return;
      const pcm=floatToPcm16(e.inputBuffer.getChannelData(0)); liveWs.send(JSON.stringify({type:"input_audio_buffer.append",audio:arrayBufferToBase64(pcm)}));
    };
  }catch(e){cleanupLiveSpeaking();state.speakingLive=false;state.speakingLiveStatus="";render();alert(e.message||"Unable to start live speaking.")}
}
async function stopLiveSpeaking(){
  if(!state.speakingLive)return;
  state.speakingLive=false;state.speakingLiveStatus="Finishing transcript and evaluation…";render();
  try{
    liveWs?.close(); liveProcessor?.disconnect(); liveGain?.disconnect(); liveStream?.getTracks().forEach(t=>t.stop()); if(liveAudioContext)await liveAudioContext.close();
    await new Promise(r=>setTimeout(r,700));
    const p=SPEAKING_PARTS[state.speakingPart-1], prompt=p.cue||p.qs.join(" "), transcript=String(window.liveSpeakingTranscript||liveTranscriptParts.join(" ")).trim();
    if(transcript){
      const r=await fetch("/api/speaking/evaluate",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,part:state.speakingPart,transcript})});
      const d=await r.json().catch(()=>({})); if(!r.ok)throw new Error(d.message||"Unable to evaluate the live interview.");
      state.lastSpeakingResult=d; addAttempt({skill:"speaking",overall:d.overallBand,recorded:true,realtime:true,serverId:d.id});
    }else alert("No transcript was received from the live interview.");
  }catch(e){alert(e.message||"Unable to finish the live interview.")}
  cleanupLiveSpeaking();state.speakingLive=false;state.speakingLiveStatus="";render();
}
function cleanupLiveSpeaking(){
  try{liveWs?.close()}catch{}; try{liveProcessor?.disconnect()}catch{}; try{liveGain?.disconnect()}catch{}; liveStream?.getTracks().forEach(t=>t.stop()); if(liveAudioContext?.state!=="closed")liveAudioContext?.close().catch(()=>{}); liveWs=null;liveProcessor=null;liveGain=null;liveStream=null;liveAudioContext=null;liveNextPlayTime=0;
}

function progress(){let latest=state.attempts[0];return layout(`<div class="page-title"><div class="eyebrow">YOUR PERFORMANCE</div><h1>Progress</h1><p>Track your practice and identify where to focus next.</p></div><div class="analytics"><div class="card"><span class="muted">Target band</span><strong>${state.target}</strong></div><div class="card"><span class="muted">Attempts</span><strong>${state.attempts.length}</strong></div><div class="card"><span class="muted">Latest overall</span><strong>${latest?.overall||'—'}</strong></div></div><section class="section"><div class="heading"><h2>Skill breakdown</h2></div><div class="skill-grid">${[['Listening','listening'],['Reading','reading'],['Writing','writing'],['Speaking','speaking']].map(x=>{const band=latestSkillBand(x[1]);return `<div class="card"><b>${x[0]}</b><strong style="display:block;font-size:25px;margin-top:7px">${band??'—'}</strong><span class="bar"><i style="width:${band?band/9*100:0}%"></i></span></div>`}).join("")}</div></section><section class="section"><h2>Practice history</h2><div class="history">${state.attempts.length?state.attempts.map(a=>`<div class="history-row"><span>${a.skill||'Mock test'}</span><span>${a.correct??'—'}/${a.total??'—'}</span><b>${a.overall||'—'}</b></div>`).join(""):'<div class="empty">Complete a practice activity to build your history.</div>'}</div></section>`)}
function profile(){return layout(`<div class="page-title"><div class="eyebrow">ACCOUNT</div><h1>Profile</h1><p>Set your preparation target.</p></div><div class="profile"><div class="big-avatar">${state.user.slice(0,1).toUpperCase()}</div><div><h2>${state.user}</h2><p class="muted">Demo account — Firebase connection comes later.</p></div></div><div class="settings"><h2>Target band</h2><p class="muted">Choose the score you are working towards.</p><select id="target">${[5.5,6,6.5,7,7.5,8,8.5,9].map(x=>`<option ${x===state.target?'selected':''}>${x}</option>`).join("")}</select><button class="btn primary" style="margin-top:12px" onclick="state.target=Number(document.getElementById('target').value);localStorage.setItem('ielts-target',state.target);alert('Target band saved.')">Save target</button></div>`)}
function login(){return `<div class="auth"><div class="auth-card"><div class="auth-brand"><div class="logo">I</div><h1>IELTS Prep</h1><p>Practice with purpose. Prepare with confidence.</p></div><div class="form"><label>Email<input id="email" type="email" placeholder="you@example.com"></label><label>Password<input id="pass" type="password" placeholder="••••••••"></label><div id="err"></div><button class="btn primary" onclick="doLogin()">Sign in</button></div><p class="center muted"><a href="#" onclick="showResend()">Didn't receive your verification email? Resend link</a></p><p class="center muted"><a href="#" onclick="showForgotPassword()">Forgot your password?</a></p><p class="center muted">New here? <a href="#" onclick="state.page='register';render()">Create an account</a></p></div></div>`}

function register(){return `<div class="auth"><div class="auth-card"><div class="auth-brand"><div class="logo">I</div><h1>Create your account</h1><p>Start your IELTS preparation journey.</p></div><div class="form"><label>Name<input id="name" placeholder="Your name"></label><label>Email<input id="email" type="email" placeholder="you@example.com"></label><label>Password<input id="pass" type="password" placeholder="••••••••"></label><div id="err"></div><button class="btn primary" onclick="doRegister()">Create account</button></div><p class="center muted">Already have an account? <a href="#" onclick="state.page='login';render()">Sign in</a></p></div></div>`}

async function showResend(){
  const email = prompt("Enter the email address you registered with:");
  if(!email) return;
  try{
    await resendVerification(email.trim());
    alert("If an account is awaiting verification, a new verification link has been sent.");
  }catch(e){
    alert(e.message || "Unable to resend verification email.");
  }
}

async function showForgotPassword(){
  const email=prompt("Enter the email address for your IELTS Prep CBT account:");
  if(!email) return;
  try{
    await forgotPassword(email.trim());
    alert("If an account exists for that email, password-reset instructions have been sent.");
  }catch(e){
    alert(e.message||"Unable to process the password-reset request.");
  }
}

async function doLogout(){
  try{ await apiLogout(); }catch(e){}
  state.user=null;
  sessionStorage.removeItem("ielts-user");
  state.page="login";
  render();
}

async function doLogin(){
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("pass").value;
  if(!email||!password){
    document.getElementById("err").innerHTML='<div class="error">Enter your email and password.</div>';
    return;
  }
  try{
    setGlobalLoading(true,"Signing you in…","Checking your account");
    const data=await apiLogin(email,password);
    if(data.verified !== true){
      document.getElementById("err").innerHTML='<div class="error">Please verify your email before signing in. <a href="#" onclick="showResend()">Resend verification link</a></div>';
      return;
    }
    state.user=data.user?.name || email.split("@")[0];
    sessionStorage.setItem("ielts-user",state.user);
    nav("dashboard");
    loadFirestoreContent();
    fetchAttempts();
  }catch(e){
    document.getElementById("err").innerHTML='<div class="error">'+(e.message||"Unable to sign in.")+'</div>';
  }finally{setGlobalLoading(false);}
}

async function doRegister(){
  const name=document.getElementById("name").value.trim();
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("pass").value;
  if(!name||!email||password.length<8){
    document.getElementById("err").innerHTML='<div class="error">Enter your name, email and a password of at least 8 characters.</div>';
    return;
  }
  try{
    setGlobalLoading(true,"Creating your account…","Saving your details and sending verification email");
    await apiRegister(name,email,password);
    document.getElementById("err").innerHTML='<div class="success"><b>Check your email.</b><br>A verification link has been sent to your email address. Your IELTS account will not be activated until you verify it.<br><br><button class="btn secondary" onclick="showResend()">Resend verification link</button></div>';
  }catch(e){
    document.getElementById("err").innerHTML='<div class="error">'+(e.message||"Registration failed.")+'</div>';
  }finally{setGlobalLoading(false);}
}

// SPCK preview uses inline onclick handlers. Expose the required module values/functions.
function bind(){
  const editor=document.getElementById("editor");
  if(editor) editor.addEventListener("input",()=>{state.writingText=editor.value;const wc=document.getElementById("wc");if(wc)wc.textContent=editor.value.trim()?editor.value.trim().split(/\s+/).length:0});
}
Object.assign(window, {
  state, render, nav, setGlobalLoading, showResend, showForgotPassword, doLogin, doRegister, doLogout,
  nextStage, finishExam, submitSkill, submitWriting, toggleRecord, startLiveSpeaking, stopLiveSpeaking, loadFirestoreContent
});
// Authentication is intentionally session-only. Returning to the site after a page leave/reload requires a fresh login.
state.user=null;
sessionStorage.removeItem("ielts-user");
render();
// Invalidate the server session when the page is being left so a later visit cannot reuse it.
window.addEventListener("pagehide",()=>{try{fetch("/api/auth",{method:"POST",keepalive:true,headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"logout"})})}catch(e){}});
