const studentStyle = document.createElement('link');
studentStyle.rel = 'stylesheet';
studentStyle.href = '/static/student.css?v=20260920';
document.head.appendChild(studentStyle);

const $ = (id) => document.getElementById(id);
const topic = $('topic'), days = $('days'), minutes = $('minutes'), confidence = $('confidence'), examDate = $('exam-date');
const button = $('generate'), result = $('result'), plannerError = $('planner-error'), sidebar = $('sidebar');
const views = ['dashboard', 'planner', 'subjects', 'revision', 'quiz', 'progress'];
const STORAGE_KEY = 'dhanuStudyState';
const defaults = {focus: 0, done: 0, streak: 0, confidence: '—', lastStudyDate: '', deadlines: [], materials: [], weakTopics: [], sessions: [], subjects: [], plan: null, planInput: null};
let state = loadState();
let timer = null, secondsLeft = 0, currentSession = 0;

function loadState(){
  try { return {...defaults, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))}; }
  catch { return {...defaults}; }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateStats(); renderStudentLayer(); renderSubjects(); renderDashboardSubjects(); updateReadiness(); }
function updateStats(){
  const set=(id,v)=>{const e=$(id);if(e)e.innerHTML=v};
  set('focus-stat', `${state.focus}<span> min</span>`); set('done-stat', `${state.done}<span> tasks</span>`);
  set('streak-stat', `${state.streak}<span> days</span>`); set('confidence-stat', `${state.confidence}<span>/10</span>`);
  set('progress-focus', `${state.focus}m`); set('progress-done', state.done); set('progress-streak', state.streak);
}
function showView(name){
  views.forEach(v => $(`${v}-view`)?.classList.toggle('hidden-view', v !== name));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  const crumb = document.querySelector('.crumb');
  if(crumb) crumb.innerHTML = `My study space <span>/</span> <b>${name==='dashboard'?'Today':name==='planner'?'Plan my week':name.charAt(0).toUpperCase()+name.slice(1)}</b>`;
  sidebar?.classList.remove('open'); window.scrollTo({top:0,behavior:'smooth'});
  if(name==='progress') renderWeekly(); if(name==='quiz') renderQuizHome(); if(name==='subjects') renderSubjects();
}

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-view-target]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.viewTarget)));
$('hero-plan')?.addEventListener('click',()=>showView('planner')); $('open-planner')?.addEventListener('click',()=>showView('planner'));
$('menu')?.addEventListener('click',()=>sidebar?.classList.toggle('open'));
document.querySelectorAll('.problem-card').forEach(card=>card.addEventListener('click',()=>{const a=card.dataset.action;if(a==='planner')showView('planner');if(a==='revision')showView('revision');if(a==='quiz')showView('quiz');if(a==='focus')startFocus()}));
$('next-action')?.addEventListener('click',startFocus); $('focus-button')?.addEventListener('click',startFocus); $('revision-start')?.addEventListener('click',()=>showView('quiz')); $('quiz-start')?.addEventListener('click',()=>showView('quiz'));

function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function parseSyllabus(text){
  return [...new Set(String(text||'').split(/\r?\n|;|•/).map(line=>line.replace(/^\s*(?:[-*•]|\d+[.)]|[A-Za-z][.)])\s*/, '').trim()).filter(x=>x.length>=2 && x.length<=180)];
}
function subjectTopicText(){
  return state.subjects.map(s=>`${s.name}: ${s.topics.join('; ')}`).join('\n');
}
function addTopicsToSubject(subject, text){
  const parsed=parseSyllabus(text); subject.topics=[...new Set([...(subject.topics||[]),...parsed])].slice(0,200); return parsed.length;
}
function renderDashboardSubjects(){
  const box=$('dashboard-subject-list'); if(!box)return;
  box.innerHTML=state.subjects.slice(0,5).map((s,i)=>`<div class="subject"><div class="subject-icon ${['math','phy','eco'][i%3]}">${escapeHtml(s.name.slice(0,1).toUpperCase())}</div><div><b>${escapeHtml(s.name)}</b><small>${s.topics.length} topic${s.topics.length===1?'':'s'} saved</small></div><div class="subject-progress"><span>${s.topics.length}</span><i><b style="width:${Math.min(100,s.topics.length*10)}%"></b></i></div></div>`).join('') || '<div class="empty-inline">No subjects yet — add your first one in My subjects.</div>';
}
function renderSubjects(){
  const list=$('subject-list'), empty=$('subjects-empty'); if(!list)return;
  empty?.classList.toggle('hidden', state.subjects.length>0); list.innerHTML='';
  state.subjects.forEach((s,i)=>{
    const card=document.createElement('section'); card.className='subject-big';
    card.innerHTML=`<span class="subject-icon ${['math','phy','eco'][i%3]}">${escapeHtml(s.name.slice(0,1).toUpperCase())}</span><h3>${escapeHtml(s.name)}</h3><b>${s.topics.length?`${s.topics.length} topic${s.topics.length===1?'':'s'}`:'No topics yet'}</b><div class="progress-track"><i style="width:${Math.min(100,s.topics.length*10)}%"></i></div><div class="topic-list">${s.topics.slice(0,12).map(t=>`<span>${escapeHtml(t)}</span>`).join('')||'<small>Add a chapter or paste the syllabus below.</small>'}</div><div class="subject-edit-row"><input class="quick-input chapter-input" placeholder="Add a chapter / topic"><button class="ghost-btn add-topic" data-id="${s.id}">＋ Add topic</button></div><textarea class="syllabus-input syllabus-more" data-id="${s.id}" placeholder="Or paste more syllabus topics…"></textarea><div class="subject-actions"><button class="text-btn parse-more" data-id="${s.id}">Parse pasted syllabus →</button><button class="text-btn danger-btn delete-subject" data-id="${s.id}">Delete subject</button></div>`;
    list.appendChild(card);
  });
  list.querySelectorAll('.add-topic').forEach(btn=>btn.addEventListener('click',()=>{const s=state.subjects.find(x=>x.id===btn.dataset.id), input=btn.parentElement.querySelector('.chapter-input');if(s&&input.value.trim()){addTopicsToSubject(s,input.value);input.value='';save()}}));
  list.querySelectorAll('.parse-more').forEach(btn=>btn.addEventListener('click',()=>{const s=state.subjects.find(x=>x.id===btn.dataset.id), ta=list.querySelector(`.syllabus-more[data-id="${btn.dataset.id}"]`);if(s&&ta.value.trim()){const n=addTopicsToSubject(s,ta.value);ta.value='';save();toast(`${n} topic${n===1?'':'s'} added to ${s.name}.`)}}));
  list.querySelectorAll('.delete-subject').forEach(btn=>btn.addEventListener('click',()=>{state.subjects=state.subjects.filter(x=>x.id!==btn.dataset.id);save()}));
}
function setupSubjectCreation(){
  const panel=$('subject-create'); const open=()=>panel?.classList.remove('hidden'); $('add-subject')?.addEventListener('click',open); $('empty-add-subject')?.addEventListener('click',open);
  $('cancel-subject')?.addEventListener('click',()=>panel?.classList.add('hidden'));
  $('save-subject')?.addEventListener('click',()=>{
    const name=$('new-subject-name').value.trim(), syllabus=$('new-subject-syllabus').value.trim(), err=$('subject-create-error');
    if(!name){err.textContent='Give the subject a name first.';err.classList.remove('hidden');return}
    const subject={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,topics:parseSyllabus(syllabus)};
    state.subjects.push(subject); $('new-subject-name').value=''; $('new-subject-syllabus').value=''; err.classList.add('hidden'); panel.classList.add('hidden'); save(); toast(`${name} is ready. Add chapters or build a plan.`);
  });
}
$('use-subjects')?.addEventListener('click',()=>{
  const text=subjectTopicText(); if(!text){$('planner-source-note').textContent='No saved subjects yet. Add one in My subjects first.';showView('subjects');return}
  topic.value=text; $('planner-source-note').textContent=`Using ${state.subjects.length} saved subject${state.subjects.length===1?'':'s'} and their real topics.`;
});

function updateHorizonNote(){
  const d=examDate?.value, n=Number(days?.value||5), note=$('horizon-note'); if(!note)return;
  if(!d){note.textContent=`${n}-day study cycle. Add an exam date when you know it.`;return}
  const diff=Math.ceil((new Date(`${d}T00:00:00`)-new Date(new Date().toISOString().slice(0,10)+'T00:00:00'))/86400000);
  if(diff<=0) note.textContent='That target date has passed. Choose the next exam or target date.';
  else if(diff<=n) note.textContent=`${diff}-day horizon to your target. The planner will keep the workload realistic.`;
  else if(diff>30) note.textContent=`${n}-day cycle inside a ${diff}-day runway. After this cycle, build the next cycle until the exam date.`;
  else note.textContent=`${n}-day cycle inside a ${diff}-day runway. Continue with the next cycle before the exam.`;
}
days?.addEventListener('change',updateHorizonNote); examDate?.addEventListener('change',updateHorizonNote); updateHorizonNote();

function plannerPayload(){
  let value=topic.value.trim();
  if(!value) value=subjectTopicText();
  return {topic:value,days:Number(days.value),minutes:Number(minutes.value),confidence:confidence.value,exam_date:examDate.value};
}
async function generatePlan(){
  const payload=plannerPayload();
  if(!payload.topic){topic.focus();topic.placeholder='Add a subject and syllabus first, or paste your topics here…';return}
  button.disabled=true; button.innerHTML='✦ Thinking about what matters most…'; result.classList.remove('hidden'); plannerError.classList.add('hidden');
  result.innerHTML='<div class="mode">AI STUDY COACH · ANALYZING</div><h2>Building a plan around your actual topics…</h2><p style="color:#777d94;font-size:13px">Prioritising deadlines, recall, practice and revision.</p>';
  try{
    const response=await fetch('/api/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await response.json(); if(!response.ok)throw new Error(data.message||'The AI planner is temporarily unavailable.');
    state.plan=data; state.planInput=payload; save(); renderPlan(data); result.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
    result.classList.add('hidden'); plannerError.classList.remove('hidden'); plannerError.innerHTML=`<b>We hit a small problem.</b><p>${escapeHtml(e.message)}</p><button class="primary-btn" id="planner-retry">Retry AI plan →</button><small>Your saved subjects and study data are safe.</small>`;
    $('planner-retry')?.addEventListener('click',generatePlan);
  }finally{button.disabled=false;button.innerHTML='✦ Build my realistic plan <span>→</span>'}
}
button?.addEventListener('click',generatePlan);
function renderPlan(data){
  const items=Array.isArray(data.items)?data.items:[];
  result.innerHTML=`<div class="mode">${escapeHtml(data.mode||'AI STUDY COACH')}</div><h2>${escapeHtml(data.title||'Your realistic study plan')}</h2><p class="coach-note">✦ ${escapeHtml(data.coach||'Built around progress, not pressure.')}</p><div class="saved-plan-note">✓ Saved on this device · ${items.length}-day cycle${data.exam_date&&data.exam_date!=='Not set'?` · target ${escapeHtml(data.exam_date)}`:''}</div>`+
    items.map(item=>`<div class="day"><div class="day-top"><h3>Day ${escapeHtml(item.day)} · ${escapeHtml(item.title)}</h3><button class="task-done" type="button">Done</button></div><ul>${(item.tasks||[]).map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ul></div>`).join('');
  result.querySelectorAll('.task-done').forEach(b=>b.addEventListener('click',()=>{if(!b.classList.contains('done')){b.textContent='✓ Done';b.classList.add('done');state.done++;save()}}));
}

function startFocus(){
  const input=$('session-minutes');
  if(!timer){currentSession=Math.max(10,Math.min(240,Number(input?.value)||Number(localStorage.getItem('dhanuSessionMinutes'))||25));secondsLeft=currentSession*60;timer=setInterval(()=>{secondsLeft--;const total=currentSession*60,elapsed=total-secondsLeft;const bar=$('session-bar');if(bar)bar.style.width=`${Math.min(100,elapsed/total*100)}%`;const btn=$('session-start');if(btn)btn.textContent=`${String(Math.floor(secondsLeft/60)).padStart(2,'0')}:${String(secondsLeft%60).padStart(2,'0')}`;if(secondsLeft<=0)finishFocus()},1000)}else pauseFocus();
}
function pauseFocus(){if(timer){clearInterval(timer);timer=null;const b=$('session-start');if(b)b.textContent='▶ Resume session'}}
function finishFocus(){if(timer)clearInterval(timer);timer=null;state.focus+=currentSession;state.done+=1;const today=new Date().toISOString().slice(0,10);const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);state.streak=state.lastStudyDate===yesterday?state.streak+1:state.lastStudyDate===today?Math.max(1,state.streak):1;state.lastStudyDate=today;state.sessions.push({date:today,minutes:currentSession});save();renderStudentLayer();toast(`Session complete. ${currentSession} minutes counted. Now do 5 quick recall questions.`)}

function renderStudentLayer(){
 const dash=$('dashboard-view');if(!dash)return;let layer=$('student-command-layer');if(!layer){layer=document.createElement('div');layer.id='student-command-layer';dash.querySelector('.stats-grid')?.insertAdjacentElement('afterend',layer)}
 const due=state.deadlines.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));const nearest=due[0];const mins=Number(localStorage.getItem('dhanuSessionMinutes')||25);
 layer.innerHTML=`<div class="student-command"><section class="panel command-card next-action"><div class="section-kicker">YOUR NEXT 15 MINUTES</div><div class="next-time"><span id="next-minutes">${mins}</span> <span>MIN</span></div><h3 id="next-title">${escapeHtml(nearest?`${nearest.subject}: ${nearest.topic}`:(state.weakTopics[0]||state.plan?.items?.[0]?.title||'Tell me what you need to study'))}</h3><p id="next-why">${nearest?`Nearest deadline: ${escapeHtml(nearest.date)}. I’ll start with this.`:'Add a deadline or build a plan and I’ll choose the next move.'}</p><div class="session-controls"><input id="session-minutes" class="session-minutes" type="number" min="10" max="240" value="${mins}"><button class="primary-btn" id="session-start">▶ Start this session</button><button class="ghost-btn" id="session-pause">Pause</button></div><div class="session-progress"><i id="session-bar"></i></div></section><section class="panel command-card"><div class="section-kicker">REAL STUDY INPUTS</div><div class="command-title">Your deadlines</div><p class="command-copy">Give the coach every exam, assignment or project. It will prioritise the nearest risk.</p><div class="deadline-list">${due.slice(0,3).map((d,i)=>`<div class="deadline-row"><span>📌</span><div><b>${escapeHtml(d.subject||'Deadline')} · ${escapeHtml(d.topic||'Study')}</b><small>${escapeHtml(d.date)} · ${i===0?'NEXT UP':'queued'}</small></div></div>`).join('')||'<small class="muted">No deadlines yet — add your first one below.</small>'}</div><div class="command-actions"><input id="deadline-subject" class="quick-input" placeholder="Subject"><input id="deadline-topic" class="quick-input" placeholder="Exam / assignment"><input id="deadline-date" class="quick-input" type="date"><button class="primary-btn" id="add-deadline">+ Add</button></div></section></div><div class="student-command"><section class="panel command-card"><div class="section-kicker">STUDY MATERIALS</div><div class="command-title">Keep the real syllabus close.</div><p class="command-copy">You can save material names locally for this browser. The planner uses your saved subject topics; files are not uploaded automatically.</p><label class="material-upload">＋ Add notes / textbook / PDF<input id="material-files" type="file" multiple accept=".pdf,.txt,.md,.doc,.docx"></label><div class="material-list">${state.materials.slice(-4).reverse().map(m=>`<div class="material-row"><span>📚</span><div><b>${escapeHtml(m.name)}</b><small>${Math.round((m.size||0)/1024)} KB · saved locally</small></div></div>`).join('')||'<small class="muted">No material added yet.</small>'}</div></section><section class="panel command-card"><div class="section-kicker">PERSISTENCE</div><div class="command-title">Your progress follows you here.</div><p class="command-copy">Plans, streaks, focus time, completed tasks and confidence are saved in this browser across refreshes and sessions.</p><button class="ghost-btn" id="sync-info">Sign in to save across devices →</button><div id="sync-note" class="inline-error hidden">Cloud sign-in is not connected in this hackathon build yet. Your current data remains safely stored on this device.</div></section></div>`;
 bindStudentControls();
}
function bindStudentControls(){
 $('add-deadline')?.addEventListener('click',()=>{const s=$('deadline-subject').value.trim(),t=$('deadline-topic').value.trim(),d=$('deadline-date').value;if(!s||!t||!d)return;state.deadlines.push({subject:s,topic:t,date:d});save()});
 $('material-files')?.addEventListener('change',e=>{Array.from(e.target.files||[]).forEach(f=>state.materials.push({name:f.name,size:f.size,type:f.type}));save()});
 $('session-minutes')?.addEventListener('change',e=>{localStorage.setItem('dhanuSessionMinutes',Math.max(10,Math.min(240,Number(e.target.value)||25)));renderStudentLayer()});
 $('session-start')?.addEventListener('click',startFocus); $('session-pause')?.addEventListener('click',pauseFocus); $('sync-info')?.addEventListener('click',()=> $('sync-note')?.classList.toggle('hidden'));
}

async function askCoach(){
 const err=$('coach-error'),msg=$('coach-message'),mode=$('coach-mode'),btn=$('ask-coach'); if(!btn)return;
 btn.disabled=true;btn.textContent='Thinking…';err.classList.add('hidden');
 try{
  const context=`Subjects: ${subjectTopicText()||'none yet'}. Weak topics: ${state.weakTopics.join(', ')||'none recorded'}. Focus: ${state.focus} minutes. Tasks done: ${state.done}. Confidence: ${state.confidence}/10.`;
  const r=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context})});const data=await r.json();if(!r.ok)throw new Error(data.message||'The AI coach is unavailable.');
  msg.textContent=`“${data.message}”`;mode.textContent=data.mode==='AI mode'?'AI coaching':'Student-first coaching';
 }catch(e){err.innerHTML=`Couldn’t reach the AI coach. <button id="coach-retry" class="text-btn">Retry →</button>`;err.classList.remove('hidden');$('coach-retry')?.addEventListener('click',askCoach)}finally{btn.disabled=false;btn.textContent='Ask AI →'}
}
$('ask-coach')?.addEventListener('click',askCoach);

async function renderQuizHome(){
 const view=$('quiz-view');if(!view)return;let box=$('quiz-runtime');if(!box){box=document.createElement('div');box.id='quiz-runtime';box.className='panel';view.appendChild(box)}
 const suggested=state.weakTopics[0]||state.subjects.flatMap(s=>s.topics).find(Boolean)||state.deadlines[0]?.topic||'your current topic';
 box.innerHTML=`<div class="section-kicker">PRACTICE LAB</div><h2>5 questions. No self-rating.</h2><p class="command-copy">I’ll score you, show the gaps and push weak topics back into your study queue.</p><div class="command-actions"><input id="quiz-topic" class="quick-input" value="${escapeHtml(suggested)}"><button class="primary-btn" id="quiz-generate">Generate 5 questions →</button></div><div id="quiz-box"></div>`;
 $('quiz-generate').addEventListener('click',generateQuiz);
}
async function generateQuiz(){
 const qt=$('quiz-topic'),qb=$('quiz-box'),name=qt.value.trim()||'my topic';qb.innerHTML='<p class="muted">Generating a real practice set…</p>';
 try{
  const material=subjectTopicText();const r=await fetch('/api/quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:name,material})});const data=await r.json();if(!r.ok)throw new Error(data.message||'The Practice Lab is temporarily unavailable.');const qs=data.questions||[];
  qb.innerHTML=`<div class="mode">${escapeHtml(data.mode||'PRACTICE')}</div><h3>${escapeHtml(data.title||'Quick check')}</h3>`+qs.map((q,i)=>`<div class="quiz-q"><b>${i+1}. ${escapeHtml(q.q)}</b>${q.options.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${escapeHtml(o)}</label>`).join('')}</div>`).join('')+`<button class="primary-btn" id="score-quiz">Score my answers</button><div id="quiz-score"></div>`;
  $('score-quiz').addEventListener('click',()=>scoreQuiz(qs,name));
 }catch(e){qb.innerHTML=`<div class="error-panel"><b>Practice Lab couldn't generate questions.</b><p>${escapeHtml(e.message)}</p><button class="primary-btn" id="quiz-retry">Retry practice →</button></div>`;$('quiz-retry')?.addEventListener('click',generateQuiz)}
}
function scoreQuiz(qs,name){let correct=0;qs.forEach((q,i)=>{const selected=document.querySelector(`input[name="q${i}"]:checked`);if(selected&&Number(selected.value)===Number(q.answer))correct++});const pct=qs.length?Math.round(correct/qs.length*100):0;const score=Math.round(pct/10);state.confidence=score;if(pct<70&&!state.weakTopics.includes(name))state.weakTopics.unshift(name);if(pct>=80)state.weakTopics=state.weakTopics.filter(x=>x!==name);save();const el=$('quiz-score');el.className='score-result';el.innerHTML=`<b>${pct}% — confidence ${score}/10</b><br>${pct<70?`Keep ${escapeHtml(name)} in your next-session queue. We’ll attack the gaps before moving on.`:pct<90?'Good progress. One more short recall round will make this stick.':'Strong result. Move this topic to maintenance revision.'}`}

function renderWeekly(){
 const view=$('progress-view');if(!view)return;let box=$('weekly-runtime');if(!box){box=document.createElement('div');box.id='weekly-runtime';box.className='panel';view.appendChild(box)}const today=new Date(),start=new Date(today);start.setDate(today.getDate()-today.getDay());const sessions=new Set(state.sessions.map(s=>s.date));const deadlineMap={};state.deadlines.forEach(d=>(deadlineMap[d.date]??=[]).push(d.topic));let cells='';for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const key=d.toISOString().slice(0,10);cells+=`<div class="calendar-day"><strong>${d.toLocaleDateString(undefined,{weekday:'short'})}</strong><small>${d.getDate()}/${d.getMonth()+1}</small>${sessions.has(key)?'<small class="ontrack">● study done</small>':'<small class="calendar-empty">○ no session</small>'}${(deadlineMap[key]||[]).map(t=>`<small><span class="calendar-dot"></span>${escapeHtml(t)}</small>`).join('')}</div>`}box.innerHTML=`<div class="section-kicker">PACE & TIMELINE</div><h2>Am I actually on pace?</h2><p class="command-copy">Your week at a glance. Completed sessions are marked; upcoming deadlines are placed on the same timeline.</p><div class="calendar-grid">${cells}</div><div class="score-result">Actual: ${state.focus} minutes · ${state.focus>=150?'You’re on track.':'Start a small session now rather than waiting for a perfect hour.'}</div>`;
}
function updateReadiness(){
 const total=state.subjects.reduce((n,s)=>n+s.topics.length,0), done=Math.min(total,state.done), pct=total?Math.round(done/total*100):state.plan?10:0;
 const e=$('readiness-percent');if(e)e.textContent=`${pct}%`;
}
function toast(message){let t=$('dhanu-toast');if(!t){t=document.createElement('div');t.id='dhanu-toast';document.body.appendChild(t)}t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000)}

/* CONVERSATIONAL AI STUDY COACH */
function coachContext(question){
  return `You are DHANU STUDY OS, a calm and practical AI study coach.
Student question: ${question}
Subjects and topics: ${subjectTopicText()||'none added yet'}
Weak topics: ${state.weakTopics.join(', ')||'none recorded'}
Latest confidence: ${state.confidence}/10
Focus time: ${state.focus} minutes
Completed tasks: ${state.done}
Answer directly and simply. If the student is stuck, explain in small steps and finish with one concrete action. Do not invent missing syllabus details.`;
}
function addCoachMessage(text, role){
  const chat=$('coach-chat'); if(!chat)return;
  const row=document.createElement('div'); row.className=`coach-message coach-message-${role}`;
  row.innerHTML=role==='ai'
    ? `<div class="coach-avatar">D</div><div><b>DHANU</b><p>${escapeHtml(text)}</p></div>`
    : `<div class="coach-message-student"><p>${escapeHtml(text)}</p></div>`;
  chat.appendChild(row); chat.scrollTop=chat.scrollHeight;
}
async function sendCoachMessage(question){
  const input=$('coach-input'), form=$('coach-form'), status=$('coach-status'), error=$('coach-error');
  if(!question||!form)return;
  form.classList.add('is-thinking'); if(input)input.disabled=true; error?.classList.add('hidden');
  addCoachMessage(question,'student');
  if(status)status.textContent='Coach is thinking…';
  try{
    const r=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context:coachContext(question)})});
    const data=await r.json(); if(!r.ok)throw new Error(data.message||'The AI coach is temporarily unavailable.');
    addCoachMessage(data.message||'Tell me a little more about the topic.','ai');
    if(status)status.textContent=data.mode==='AI mode'?'AI coach · using your study data':'Study coach · ready';
  }catch(e){
    if(error){error.innerHTML=`Couldn’t reach the coach. <button id="coach-retry" class="text-btn" type="button">Retry →</button>`;error.classList.remove('hidden');$('coach-retry')?.addEventListener('click',()=>sendCoachMessage(question));}
    if(status)status.textContent='Coach connection needs a retry.';
  }finally{
    form.classList.remove('is-thinking'); if(input){input.disabled=false;input.focus();}
  }
}
$('coach-form')?.addEventListener('submit',e=>{
  e.preventDefault();
  const input=$('coach-input'); const q=input?.value.trim();
  if(!q)return;
  input.value=''; sendCoachMessage(q);
});

setupSubjectCreation();updateStats();renderDashboardSubjects();renderSubjects();renderStudentLayer();updateReadiness();
