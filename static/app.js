const studentStyle=document.createElement('link');studentStyle.rel='stylesheet';studentStyle.href='/static/student.css';document.head.appendChild(studentStyle);

const topic = document.getElementById('topic');
const days = document.getElementById('days');
const minutes = document.getElementById('minutes');
const confidence = document.getElementById('confidence');
const examDate = document.getElementById('exam-date');
const button = document.getElementById('generate');
const result = document.getElementById('result');
const menu = document.getElementById('menu');
const sidebar = document.getElementById('sidebar');
const views = ['dashboard','planner','subjects','revision','quiz','progress'];

const state = JSON.parse(localStorage.getItem('dhanuStudyState') || '{"focus":0,"done":0,"streak":0,"confidence":"—"}');
let timer = null;
let secondsLeft = 0;

function save(){ localStorage.setItem('dhanuStudyState', JSON.stringify(state)); updateStats(); }
function updateStats(){
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.innerHTML=v};
  set('focus-stat', `${state.focus}<span> min</span>`); set('done-stat', `${state.done}<span> tasks</span>`); set('streak-stat', `${state.streak}<span> days</span>`); set('confidence-stat', `${state.confidence}<span>/10</span>`);
  set('progress-focus', `${state.focus}m`); set('progress-done', state.done); set('progress-streak', state.streak);
}
updateStats();

function showView(name){
  views.forEach(view=>document.getElementById(`${view}-view`)?.classList.toggle('hidden-view',view!==name));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  const crumb=document.querySelector('.crumb'); if(crumb) crumb.innerHTML=`My study space <span>/</span> <b>${name==='dashboard'?'Today':name==='planner'?'Plan my week':name.charAt(0).toUpperCase()+name.slice(1)}</b>`;
  sidebar?.classList.remove('open'); window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-view-target]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.viewTarget)));
document.getElementById('hero-plan')?.addEventListener('click',()=>showView('planner'));
document.getElementById('open-planner')?.addEventListener('click',()=>showView('planner'));
menu?.addEventListener('click',()=>sidebar?.classList.toggle('open'));

document.querySelectorAll('.problem-card').forEach(card=>card.addEventListener('click',()=>{
  const action=card.dataset.action;
  if(action==='planner') showView('planner');
  if(action==='revision') showView('revision');
  if(action==='quiz') showView('quiz');
  if(action==='focus') startFocus();
}));
document.getElementById('next-action')?.addEventListener('click',()=>showView('planner'));
document.getElementById('ask-coach')?.addEventListener('click',()=>showView('planner'));
document.getElementById('revision-start')?.addEventListener('click',()=>alert('10-minute recall: close your notes, write what you remember, then check the gaps. Your next version will save recall results automatically.'));
document.getElementById('quiz-start')?.addEventListener('click',()=>showView('planner'));
document.getElementById('focus-button')?.addEventListener('click',startFocus);

function startFocus(){
  const btn=document.getElementById('focus-button');
  if(timer){ clearInterval(timer); timer=null; btn.textContent='▶'; return; }
  secondsLeft=25*60; btn.textContent='25:00';
  timer=setInterval(()=>{ secondsLeft--; const m=String(Math.floor(secondsLeft/60)).padStart(2,'0'); const s=String(secondsLeft%60).padStart(2,'0'); btn.textContent=`${m}:${s}`; if(secondsLeft<=0){clearInterval(timer);timer=null;state.focus+=25;state.done+=1;state.streak=Math.max(1,state.streak);save();btn.textContent='✓'; alert('Nice. One focused block finished. Take a short break, then decide what is next.');}},1000);
}

button?.addEventListener('click',async()=>{
  const value=topic.value.trim(); if(!value){topic.focus();topic.placeholder='Paste your syllabus, chapters, homework or exam topics first…';return;}
  button.disabled=true; button.innerHTML='✦ Thinking about what matters most…'; result.classList.remove('hidden');
  result.innerHTML='<div class="mode">AI STUDY COACH · ANALYZING</div><h2>Building a plan around your actual time…</h2><p style="color:#777d94;font-size:13px">Prioritising topics, reducing overload and adding recall + practice.</p>';
  try{
    const response=await fetch('/api/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:value,days:Number(days.value),minutes:Number(minutes.value),confidence:confidence.value,exam_date:examDate.value})});
    const data=await response.json(); if(!response.ok) throw new Error(data.error||'Request failed'); renderPlan(data); result.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){result.innerHTML='<h2>We hit a small problem.</h2><p style="color:#858ba5">Your study idea is saved on this screen. Try again in a moment.</p>';}
  finally{button.disabled=false;button.innerHTML='✦ Build my realistic plan <span>→</span>';}
});

function renderPlan(data){
  const items=Array.isArray(data.items)?data.items:[];
  result.innerHTML=`<div class="mode">${escapeHtml(data.mode||'AI STUDY COACH')}</div><h2>${escapeHtml(data.title||'Your realistic study plan')}</h2><p class="coach-note">✦ ${escapeHtml(data.coach||'Your plan is designed around progress, not pressure.')}</p>`+
  items.map(item=>`<div class="day"><div class="day-top"><h3>Day ${escapeHtml(item.day)} · ${escapeHtml(item.title)}</h3><button class="task-done" type="button">Done</button></div><ul>${(item.tasks||[]).map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ul></div>`).join('');
  result.querySelectorAll('.task-done').forEach(btn=>btn.addEventListener('click',()=>{btn.textContent='✓ Done';btn.classList.add('done');state.done++;save();}));
}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
