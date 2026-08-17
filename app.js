import { register as apiRegister, resendVerification, login as apiLogin } from "./auth-api.js";
const state={
 page:"dashboard", user:null, target:Number(localStorage.getItem("ielts-target")||7.5),
 attempts:JSON.parse(localStorage.getItem("ielts-attempts")||"[]"), answers:{}, submitted:false,
 type:"academic", stage:0, writingTask:1, writingText:"", speakingPart:1, recording:false, timer:null
};
const questions=[
 {id:"L1",skill:"listening",number:1,type:"mc",prompt:"What time does the visitor want to arrive?",options:["8:00","8:30","9:00","9:30"],answer:"8:30",ex:"The speaker confirms an arrival time of half past eight."},
 {id:"L2",skill:"listening",number:2,type:"text",prompt:"Write the visitor's surname.",answer:"Morgan",ex:"The surname is stated clearly during the booking."},
 {id:"R1",skill:"reading",number:1,type:"mc",prompt:"What is the main idea of the passage?",options:["Urban gardens are always profitable businesses.","Urban gardens can provide food and community benefits when properly managed.","Urban gardens require no maintenance.","Urban gardens are replacing all city parks."],answer:"Urban gardens can provide food and community benefits when properly managed.",ex:"The passage links food access and community benefits to appropriate management."},
 {id:"R2",skill:"reading",number:2,type:"mc",prompt:"Urban gardens require no volunteers.",options:["TRUE","FALSE","NOT GIVEN"],answer:"FALSE",ex:"The passage says success often depends on local volunteers."},
 {id:"R3",skill:"reading",number:3,type:"mc",prompt:"Choose the best heading for the passage.",options:["A. The management needs of shared urban gardens","B. A history of farming machinery","C. The decline of rural communities","D. International food prices"],answer:"A. The management needs of shared urban gardens",ex:"The passage focuses on benefits and practical requirements."}
];
const tests=[
 {id:"academic-01",type:"academic",title:"Academic Mock Test 01",desc:"A complete practice framework covering Listening, Reading and Writing.",duration:150},
 {id:"general-01",type:"general",title:"General Training Mock Test 01",desc:"General Training practice with a structured timed flow.",duration:150}
];
function save(){localStorage.setItem("ielts-attempts",JSON.stringify(state.attempts))}
function nav(p){state.page=p;state.submitted=false;state.answers={};render()}
function addAttempt(a){state.attempts.unshift({...a,date:new Date().toLocaleDateString()});save()}
function band(skill,c,total){if(!total)return 0;let table=skill==="listening"?[[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[27,6.5],[23,6],[18,5.5],[16,5],[13,4.5]]:[[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5]];for(const x of table)if(c>=x[0])return x[1];return Math.max(3,Math.round(c/total*18)/2)}
function overall(vals){let a=vals.filter(Boolean);return a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*2)/2:0}
function layout(inner){
 return `<div class="shell"><aside class="sidebar" id="side"><div class="brand"><div class="logo">I</div><div><b>IELTS Prep</b><small>CBT Practice</small></div></div><div class="nav">
 ${[['dashboard','⌂ Dashboard'],['practice','▶ Practice'],['mock','▣ Mock Tests'],['listening','🎧 Listening'],['reading','📖 Reading'],['writing','✍ Writing'],['speaking','🎤 Speaking'],['progress','▥ Progress'],['profile','◉ Profile']].map(x=>`<button class="${state.page===x[0]?'active':''}" onclick="nav('${x[0]}')">${x[1]}</button>`).join("")}
 </div><button class="signout" onclick="nav('login')">↪ Sign out</button></aside><div class="overlay hidden" id="overlay" onclick="toggleMenu()"></div><main class="main"><header class="top"><button class="mobile-menu" onclick="toggleMenu()">☰</button><b>IELTS Practice Centre</b><div class="avatar">${(state.user||"S").slice(0,1).toUpperCase()}</div></header><div class="content">${inner}</div></main></div>`
}
function render(){
 if(!state.user && state.page!=="login" && state.page!=="register"){state.page="login"}
 const pages={dashboard:dashboard,practice:practice,mock:mock,listening:()=>skillPage("listening"),reading:()=>skillPage("reading"),writing:writing,speaking:speaking,progress:progress,profile:profile,exam:exam,login:login,register:register};
 document.getElementById("app").innerHTML=(pages[state.page]||dashboard)();
 bind();
}
function toggleMenu(){document.getElementById("side")?.classList.toggle("open");document.getElementById("overlay")?.classList.toggle("hidden")}
function dashboard(){let latest=state.attempts[0];let skills=[["Listening",7,"🎧","listening"],["Reading",6.5,"📖","reading"],["Writing",6,"✍","writing"],["Speaking",6.5,"🎤","speaking"]];return layout(`<section class="hero"><div><div class="eyebrow">YOUR PREPARATION HUB</div><h1>Welcome back, ${state.user}.</h1><p>Keep building the skills you need for your target IELTS band.</p></div><button class="btn primary" onclick="nav('mock')">Take a mock test →</button></section><div class="cards"><div class="card stat"><span>Current estimate</span><strong>${latest?.overall||"—"}</strong><small>Latest practice</small></div><div class="card stat"><span>Target band</span><strong>${state.target}</strong><small>Your preparation target</small></div><div class="card stat"><span>Tests completed</span><strong>${state.attempts.length}</strong><small>Recorded locally</small></div><div class="card stat"><span>Study streak</span><strong>7</strong><small>Demo value</small></div></div><section class="section"><div class="heading"><div><div class="eyebrow">SKILLS</div><h2>Your IELTS skills</h2></div><button class="btn secondary" onclick="nav('progress')">View progress</button></div><div class="skill-grid">${skills.map(s=>`<button class="skill" onclick="nav('${s[3]}')"><span class="ico">${s[2]}</span><span class="skill-main"><b>${s[0]}</b><span class="bar"><i style="width:${s[1]/9*100}%"></i></span><small>Estimated band ${s[1]}</small></span>→</button>`).join("")}</div></section><section class="section"><div class="recommend"><div><span class="tag">READING</span><h3>Improve question accuracy</h3><p class="muted">Practise True/False/Not Given and Matching Headings.</p></div><button class="btn secondary" onclick="nav('reading')">Start practice</button></div></section>`)}

function practice(){let a=[["Listening","🎧","Train with section-based audio practice and varied question types.","listening"],["Reading","📖","Practise passages, matching tasks and completion tasks.","reading"],["Writing","✍","Work through Task 1 and Task 2 with word counts and timing.","writing"],["Speaking","🎤","Practise all three parts with preparation and recording prompts.","speaking"]];return layout(`<div class="page-title"><div class="eyebrow">PRACTICE CENTRE</div><h1>Choose a skill</h1><p>Focus on one IELTS skill at a time.</p></div><div class="practice-grid">${a.map(x=>`<button class="practice" onclick="nav('${x[3]}')"><span class="emoji">${x[1]}</span><h2>${x[0]}</h2><p>${x[2]}</p><b>Start practice →</b></button>`).join("")}</div>`)}

function mock(){return layout(`<div class="page-title"><div class="eyebrow">FULL EXAMS</div><h1>Mock tests</h1><p>Simulate an IELTS practice session with timed sections.</p></div><div class="switch"><button class="${state.type==='academic'?'active':''}" onclick="state.type='academic';render()">Academic</button><button class="${state.type==='general'?'active':''}" onclick="state.type='general';render()">General Training</button></div>${tests.filter(t=>t.type===state.type).map(t=>`<div class="test"><div class="test-body"><span class="tag">${t.type}</span><h2>${t.title}</h2><p>${t.desc}</p><span class="meta">⏱ ${t.duration} minutes · Listening · Reading · Writing</span></div><button class="btn primary" onclick="state.page='exam';state.stage=0;state.answers={};render()">Start →</button></div>`).join("")}`)}

function timer(seconds, id){setTimeout(()=>{let el=document.getElementById(id);if(!el)return;let end=Date.now()+seconds*1000;function tick(){let r=Math.max(0,Math.floor((end-Date.now())/1000));let m=String(Math.floor(r/60)).padStart(2,"0"),s=String(r%60).padStart(2,"0");el.textContent=`⏱ ${m}:${s}`;if(r>0)setTimeout(tick,500)}tick()},0)}
function skillPage(skill){let qs=questions.filter(q=>q.skill===skill);let title=skill[0].toUpperCase()+skill.slice(1);let html=layout(`<div class="exam-head"><div><span class="tag">${title} Practice</span><h1>${skill==='listening'?'Listening Section 1':'Reading Passage 1'}</h1><p>Original demonstration content. Production media/content can be connected later.</p></div><div class="timer" id="timer">⏱ 15:00</div></div>${skill==='listening'?'<div class="audio"><button class="play" onclick="alert(\'Demo audio placeholder. Connect licensed audio later.\')">▶</button><div><b>Demo listening audio</b><p>Production audio URL will be loaded from Storage later.</p></div></div>':''}<div class="${skill==='reading'?'passage-layout':'exam-layout'}">${skill==='reading'?'<article class="passage"><h2>Shared urban gardens</h2><p>Urban gardens can improve access to fresh food while giving residents shared spaces for learning and community activities. Their success often depends on reliable water, local volunteers and clear management arrangements.</p><p>Some projects begin on unused plots and develop gradually as residents contribute ideas, tools and time. Sustainable schemes tend to combine practical planning with community participation.</p></article>':''}<main>${qs.map(q=>qhtml(q)).join("")}<button class="btn primary" onclick="submitSkill('${skill}')">Submit ${title} practice</button>${state.submitted?'<div class="success">Practice submitted. Your result has been added to progress.</div>':''}</main><aside class="side"><b>Questions</b><div class="nums">${qs.map(q=>`<span class="${state.answers[q.id]?'answered':''}">${q.number}</span>`).join("")}</div><button class="btn secondary" style="width:100%;margin-top:12px" onclick="nav('practice')">Exit practice</button></aside></div>`);setTimeout(()=>timer(900,"timer"),0);return html}
function qhtml(q){return `<div class="question"><div class="qnum">Question ${q.number}</div><h3>${q.prompt}</h3>${q.type==='text'?`<input class="answer" value="${state.answers[q.id]||''}" oninput="state.answers['${q.id}']=this.value">`:`<div class="options">${q.options.map(o=>`<label class="option ${state.answers[q.id]===o?'selected':''}"><input type="radio" name="${q.id}" ${state.answers[q.id]===o?'checked':''} onchange="state.answers['${q.id}']='${o.replace(/'/g,"\\'")}';render()"> ${o}</label>`).join("")}</div>`}</div>`}
function submitSkill(skill){let qs=questions.filter(q=>q.skill===skill);let c=qs.filter(q=>String(state.answers[q.id]||"").trim().toLowerCase()===String(q.answer).trim().toLowerCase()).length;let b=band(skill,c,Math.max(qs.length,10));addAttempt({skill,correct:c,total:qs.length,overall:b});state.submitted=true;render()}

function writing(){let task=state.writingTask===1?{title:"Academic Writing Task 1",min:150,prompt:"The chart below compares the amount of time three groups of adults spent on selected forms of exercise in one week. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",visual:true}:{title:"Academic Writing Task 2",min:250,prompt:"Some people think schools should focus more on practical skills than academic subjects. To what extent do you agree or disagree?"};let words=state.writingText.trim()?state.writingText.trim().split(/\s+/).length:0;return layout(`<div class="page-title"><div class="eyebrow">WRITING PRACTICE</div><h1>${task.title}</h1><p>Write under realistic time and word-count conditions.</p></div><div class="switch"><button class="${state.writingTask===1?'active':''}" onclick="state.writingTask=1;state.writingText='';render()">Task 1</button><button class="${state.writingTask===2?'active':''}" onclick="state.writingTask=2;state.writingText='';render()">Task 2</button></div><div class="writing-prompt"><span class="tag">PROMPT</span><h2>${task.prompt}</h2>${task.visual?'<div class="visual">Demo chart placeholder — replace with your licensed/owned visual.</div>':''}<b>Minimum: ${task.min} words</b></div><textarea class="editor" id="editor" placeholder="Write your answer here...">${state.writingText}</textarea><div class="write-foot"><span class="muted">Word count: <b id="wc">${words}</b></span><button class="btn primary" onclick="submitWriting()">Submit response</button></div>${state.submitted?'<div class="success">Response submitted. A production backend can route this for teacher or approved evaluation.</div>':''}</div>`)}
function submitWriting(){state.writingText=document.getElementById("editor").value;addAttempt({skill:"writing",overall:6.5,wordCount:state.writingText.trim()?state.writingText.trim().split(/\s+/).length:0});state.submitted=true;render()}

function speaking(){let parts=[{n:1,title:"Part 1 — Introduction and Interview",qs:["Where do you currently live?","What do you enjoy doing in your free time?","Do you prefer studying alone or with other people?"]},{n:2,title:"Part 2 — Long Turn",cue:"Describe a useful skill you would like to learn. You should say what the skill is, why you would like to learn it, how you would learn it, and explain how it could help you."},{n:3,title:"Part 3 — Discussion",qs:["Why do some skills become more valuable as technology changes?","Should schools teach more practical skills?","How might learning methods change in the future?"]}];let p=parts[state.speakingPart-1];return layout(`<div class="page-title"><div class="eyebrow">SPEAKING PRACTICE</div><h1>${p.title}</h1><p>Practise naturally. Recording requires microphone permission.</p></div><div class="parts">${parts.map(x=>`<button class="${state.speakingPart===x.n?'active':''}" onclick="state.speakingPart=${x.n};render()">Part ${x.n}</button>`).join("")}</div><div class="speaking">${p.cue?`<span class="tag">CUE CARD</span><h2>${p.cue}</h2><p class="muted">Preparation: 1 minute · Speaking: 1–2 minutes</p>`:`${p.qs.map((q,i)=>`<div class="squestion"><b>${i+1}</b><span>${q}</span></div>`).join("")}`}<div class="record"><button class="${state.recording?'stop':''}" onclick="toggleRecord()">${state.recording?'■ Stop recording':'🎙 Start recording'}</button><span class="muted" id="recordstatus">${state.recording?'Recording…':'Ready'}</span></div></div>`)}

let mediaRecorder=null,recordChunks=[];
async function toggleRecord(){if(state.recording){mediaRecorder?.stop();state.recording=false;render();return}try{let stream=await navigator.mediaDevices.getUserMedia({audio:true});mediaRecorder=new MediaRecorder(stream);recordChunks=[];mediaRecorder.ondataavailable=e=>recordChunks.push(e.data);mediaRecorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());addAttempt({skill:"speaking",overall:6.5,recorded:true});alert("Demo recording completed. Production storage connection will be added later.")};mediaRecorder.start();state.recording=true;render()}catch(e){alert("Microphone permission is required for speaking practice.")}}

function progress(){let latest=state.attempts[0];return layout(`<div class="page-title"><div class="eyebrow">YOUR PERFORMANCE</div><h1>Progress</h1><p>Track your practice and identify where to focus next.</p></div><div class="analytics"><div class="card"><span class="muted">Target band</span><strong>${state.target}</strong></div><div class="card"><span class="muted">Attempts</span><strong>${state.attempts.length}</strong></div><div class="card"><span class="muted">Latest overall</span><strong>${latest?.overall||'—'}</strong></div></div><section class="section"><div class="heading"><h2>Skill breakdown</h2></div><div class="skill-grid">${[['Listening',7],['Reading',6.5],['Writing',6],['Speaking',6.5]].map(x=>`<div class="card"><b>${x[0]}</b><strong style="display:block;font-size:25px;margin-top:7px">${x[1]}</strong><span class="bar"><i style="width:${x[1]/9*100}%"></i></span></div>`).join("")}</div></section><section class="section"><h2>Practice history</h2><div class="history">${state.attempts.length?state.attempts.map(a=>`<div class="history-row"><span>${a.skill||'Mock test'}</span><span>${a.correct??'—'}/${a.total??'—'}</span><b>${a.overall||'—'}</b></div>`).join(""):'<div class="empty">Complete a practice activity to build your history.</div>'}</div></section>`)}
function profile(){return layout(`<div class="page-title"><div class="eyebrow">ACCOUNT</div><h1>Profile</h1><p>Set your preparation target.</p></div><div class="profile"><div class="big-avatar">${state.user.slice(0,1).toUpperCase()}</div><div><h2>${state.user}</h2><p class="muted">Demo account — Firebase connection comes later.</p></div></div><div class="settings"><h2>Target band</h2><p class="muted">Choose the score you are working towards.</p><select id="target">${[5.5,6,6.5,7,7.5,8,8.5,9].map(x=>`<option ${x===state.target?'selected':''}>${x}</option>`).join("")}</select><button class="btn primary" style="margin-top:12px" onclick="state.target=Number(document.getElementById('target').value);localStorage.setItem('ielts-target',state.target);alert('Target band saved.')">Save target</button></div>`)}
function exam(){let stages=["Listening","Reading","Writing"];if(state.stage>=3){let r=state.examResult||{overall:6.5,listening:7,reading:6.5};return layout(`<div class="result"><div class="eyebrow" style="color:#b8c9d8">MOCK TEST COMPLETE</div><h1>Estimated overall band</h1><strong>${r.overall}</strong><p>This is a practice estimate, not an official IELTS result.</p></div><div class="result-grid"><div class="card"><span class="muted">Listening</span><strong>${r.listening}</strong></div><div class="card"><span class="muted">Reading</span><strong>${r.reading}</strong></div></div><button class="btn primary" onclick="nav('progress')">View progress</button>`)}
 let qs=questions.filter(q=>q.skill===stages[state.stage].toLowerCase());return layout(`<div class="exam-head"><div><span class="tag">${state.type}</span><h1>${stages[state.stage]}</h1><p>Full mock test · Section ${state.stage+1}</p></div><div class="timer" id="examTimer">⏱ 30:00</div></div><div class="stepper">${stages.map((s,i)=>`<div class="step ${i===state.stage?'active':''}">${i+1}. ${s}</div>`).join("")}</div>${state.stage<2?`<div class="exam-layout"><main>${qs.map(q=>qhtml(q)).join("")}<button class="btn primary" onclick="nextStage()">${state.stage===1?'Continue to Writing':'Continue to next section'}</button></main><aside class="side"><b>Exam sections</b><p>1. Listening</p><p>2. Reading</p><p>3. Writing</p></aside></div>`:`<div class="writing-prompt"><h2>Writing section</h2><p>Use the dedicated Writing module for detailed Task 1 and Task 2 practice. This mock framework is ready to be expanded with both tasks in the connected version.</p><button class="btn primary" onclick="finishExam()">Finish mock test</button></div>`}`)}

function nextStage(){if(state.stage===0){let qs=questions.filter(q=>q.skill==='listening');let c=qs.filter(q=>String(state.answers[q.id]||'').toLowerCase()===q.answer.toLowerCase()).length;state.examListening=band('listening',c,10)}state.stage++;render()}
function finishExam(){state.examResult={listening:state.examListening||7,reading:6.5,overall:overall([state.examListening||7,6.5,6.5])};addAttempt({skill:"mock test",overall:state.examResult.overall});state.stage=3;render()}

function login(){return `<div class="auth"><div class="auth-card"><div class="auth-brand"><div class="logo">I</div><h1>IELTS Prep</h1><p>Practice with purpose. Prepare with confidence.</p></div><div class="form"><label>Email<input id="email" type="email" placeholder="you@example.com"></label><label>Password<input id="pass" type="password" placeholder="••••••••"></label><div id="err"></div><button class="btn primary" onclick="doLogin()">Sign in</button></div><p class="center muted"><a href="#" onclick="showResend()">Didn't receive your verification email? Resend link</a></p><p class="center muted">New here? <a href="#" onclick="state.page='register';render()">Create an account</a></p></div></div>`}

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

async function doLogin(){
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("pass").value;
  if(!email||!password){
    document.getElementById("err").innerHTML='<div class="error">Enter your email and password.</div>';
    return;
  }
  try{
    const data=await apiLogin(email,password);
    if(data.verified !== true){
      document.getElementById("err").innerHTML='<div class="error">Please verify your email before signing in. <a href="#" onclick="showResend()">Resend verification link</a></div>';
      return;
    }
    state.user=data.user?.name || email.split("@")[0];
    localStorage.setItem("ielts-user",state.user);
    nav("dashboard");
  }catch(e){
    document.getElementById("err").innerHTML='<div class="error">'+(e.message||"Unable to sign in.")+'</div>';
  }
}

async function doRegister(){
  const name=document.getElementById("name").value.trim();
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("pass").value;
  if(!name||!email||password.length<6){
    document.getElementById("err").innerHTML='<div class="error">Enter your name, email and a password of at least 6 characters.</div>';
    return;
  }
  try{
    await apiRegister(name,email,password);
    document.getElementById("err").innerHTML='<div class="success"><b>Check your email.</b><br>A verification link has been sent to your email address. Your IELTS account will not be activated until you verify it.<br><br><button class="btn secondary" onclick="showResend()">Resend verification link</button></div>';
  }catch(e){
    document.getElementById("err").innerHTML='<div class="error">'+(e.message||"Registration failed.")+'</div>';
  }
}

// SPCK preview uses inline onclick handlers. Expose the required module values/functions.
Object.assign(window, {
  state, render, nav, toggleMenu, showResend, doLogin, doRegister,
  nextStage, finishExam, submitSkill, submitWriting, toggleRecord
});
state.user=localStorage.getItem("ielts-user")||null;render();