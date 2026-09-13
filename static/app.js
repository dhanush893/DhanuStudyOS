const topic = document.getElementById('topic');
const days = document.getElementById('days');
const button = document.getElementById('generate');
const result = document.getElementById('result');
const menu = document.getElementById('menu');
const sidebar = document.getElementById('sidebar');

const views = ['dashboard','planner','subjects','revision','quiz','progress'];

function showView(name){
  views.forEach(view => {
    const el = document.getElementById(`${view}-view`);
    if (el) el.classList.toggle('hidden-view', view !== name);
  });
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === name));
  const crumb = document.querySelector('.crumb');
  if (crumb) crumb.innerHTML = `Workspace <span>/</span> <b>${name === 'dashboard' ? 'Dashboard' : name.charAt(0).toUpperCase()+name.slice(1)}</b>`;
  sidebar.classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}

document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));

document.getElementById('hero-plan')?.addEventListener('click', () => showView('planner'));
document.getElementById('open-planner')?.addEventListener('click', () => showView('planner'));
document.getElementById('revision-start')?.addEventListener('click', () => alert('Revision mode is the next module. Your AI study plan is ready first.'));
document.getElementById('quiz-start')?.addEventListener('click', () => alert('Practice Lab is coming next. Generate your study plan first.'));
menu?.addEventListener('click', () => sidebar.classList.toggle('open'));

button?.addEventListener('click', async () => {
  const value = topic.value.trim();
  if (!value) {
    topic.focus();
    topic.placeholder = 'Start with a subject, syllabus, exam or topic…';
    return;
  }

  button.disabled = true;
  button.innerHTML = '✦ Thinking through your syllabus…';
  result.classList.remove('hidden');
  result.innerHTML = '<div class="mode">AI STUDY INTELLIGENCE · ANALYZING</div><h2>Building your learning path…</h2><p style="color:#777d94;font-size:11px">Finding priorities, sequencing topics and shaping focused sessions.</p>';

  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({topic: value, days: Number(days.value)})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    renderPlan(data);
    result.scrollIntoView({behavior:'smooth',block:'start'});
  } catch (error) {
    result.innerHTML = `<h2>We couldn't build that plan yet.</h2><p style="color:#858ba5;font-size:11px">${escapeHtml(error.message || 'Please try again.')}</p>`;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Generate intelligent plan <span>→</span>';
  }
});

function renderPlan(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  result.innerHTML = `<div class="mode">${escapeHtml(data.mode || 'AI STUDY INTELLIGENCE')}</div><h2>${escapeHtml(data.title || 'Your intelligent study plan')}</h2>` +
    items.map(item => `<div class="day"><h3>Day ${escapeHtml(item.day)} · ${escapeHtml(item.title)}</h3><ul>${(item.tasks || []).map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>`).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
