const topic = document.getElementById('topic');
const days = document.getElementById('days');
const button = document.getElementById('generate');
const result = document.getElementById('result');

button.addEventListener('click', async () => {
  const value = topic.value.trim();
  if (!value) {
    topic.focus();
    topic.placeholder = 'Enter a syllabus, subject, or topic first…';
    return;
  }

  button.disabled = true;
  button.textContent = 'Building plan…';
  result.classList.remove('hidden');
  result.innerHTML = '<div class="mode">Preparing your study workspace…</div>';

  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({topic: value, days: Number(days.value)})
    });
    const data = await response.json();
    renderPlan(data);
  } catch (error) {
    result.innerHTML = '<h2>Something went wrong</h2><p>Please try again.</p>';
  } finally {
    button.disabled = false;
    button.innerHTML = 'Generate plan <span>→</span>';
  }
});

function renderPlan(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  result.innerHTML = `<div class="mode">${escapeHtml(data.mode || 'Study mode')}</div><h2>${escapeHtml(data.title || 'Your study plan')}</h2>` +
    items.map(item => `<div class="day"><h3>Day ${escapeHtml(item.day)} · ${escapeHtml(item.title)}</h3><ul>${(item.tasks || []).map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>`).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
