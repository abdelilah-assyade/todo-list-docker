/* ------------------------------------------------------------------
   Todo List - frontend logic
   Stage 1 version: works on its own (demo mode) and talks to the
   REST API as soon as the backend exists.
   ------------------------------------------------------------------ */

// Relative URL: the browser sends requests to whatever host served this page.
// Works on localhost:3000 today and inside a container later, with no edits.
const API_BASE = '/api';

const state = {
  tasks: [],
  filter: 'all',
  sort: 'created_desc',
  editingId: null,
  demo: false,
};

const el = (id) => document.getElementById(id);

const form = el('task-form');
const listEl = el('task-list');
const emptyEl = el('empty-state');
const errorEl = el('error-banner');
const loadingEl = el('loading');

/* ---------- Demo mode (Stage 1 only, removed in Stage 3) ---------- */

const DEMO_KEY = 'todo-demo-tasks';

function demoLoad() {
  const raw = localStorage.getItem(DEMO_KEY);
  if (raw) return JSON.parse(raw);
  return [
    { id: 1, title: 'Learn Docker images vs containers', description: 'Read the docs and take notes.', priority: 'high', completed: 0, due_date: null, created_at: new Date().toISOString() },
    { id: 2, title: 'Write the first Dockerfile', description: '', priority: 'medium', completed: 0, due_date: null, created_at: new Date(Date.now() - 3600000).toISOString() },
  ];
}

function demoSave() {
  localStorage.setItem(DEMO_KEY, JSON.stringify(state.tasks));
}

async function api(path, options = {}) {
  if (state.demo) throw new Error('demo');

  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let body = null;
  try { body = await res.json(); } catch (_) { /* empty body */ }

  if (!res.ok) {
    const message = (body && body.message) || 'Request failed (' + res.status + ')';
    throw new Error(message);
  }
  return body;
}

const apiCreate = (data) => api('/tasks', { method: 'POST', body: JSON.stringify(data) });
const apiUpdate = (id, data) => api('/tasks/' + id, { method: 'PUT', body: JSON.stringify(data) });
const apiToggle = (id, completed) => api('/tasks/' + id, { method: 'PATCH', body: JSON.stringify({ completed }) });
const apiRemove = (id) => api('/tasks/' + id, { method: 'DELETE' });

/* ---------- Actions ---------- */

async function loadTasks() {
  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');

  try {
    const body = await api('/tasks');
    state.tasks = (body && body.data) || [];
    state.demo = false;
    setMode('live');
  } catch (err) {
    if (err.message !== 'demo' && !(err instanceof TypeError)) {
      showError(err.message);
      loadingEl.classList.add('hidden');
      return;
    }
    state.demo = true;
    state.tasks = demoLoad();
    setMode('demo');
  }

  loadingEl.classList.add('hidden');
  render();
}

async function submitTask(event) {
  event.preventDefault();
  hideError();

  const payload = {
    title: el('title').value.trim(),
    description: el('description').value.trim(),
    priority: el('priority').value,
    due_date: el('due_date').value || null,
  };

  if (!payload.title) {
    el('error-title').textContent = 'Title is required.';
    el('title').classList.add('has-error');
    return;
  }
  el('title').classList.remove('has-error');

  try {
    if (state.editingId) {
      await saveEdit(state.editingId, payload);
    } else if (state.demo) {
      state.tasks.push(Object.assign({ id: nextId(), completed: 0, created_at: new Date().toISOString() }, payload));
      demoSave();
    } else {
      await apiCreate(payload);
    }
    resetForm();
    await loadTasks();
  } catch (err) {
    showError(err.message);
  }
}

async function saveEdit(id, payload) {
  if (state.demo) {
    const i = state.tasks.findIndex((t) => t.id === id);
    state.tasks[i] = Object.assign({}, state.tasks[i], payload, { updated_at: new Date().toISOString() });
    demoSave();
  } else {
    await apiUpdate(id, payload);
  }
}

async function toggleTask(task) {
  try {
    const next = task.completed ? 0 : 1;
    if (state.demo) {
      task.completed = next;
      demoSave();
    } else {
      await apiToggle(task.id, next);
    }
    await loadTasks();
  } catch (err) {
    showError(err.message);
  }
}

async function deleteTask(id) {
  if (!window.confirm('Delete this task? This cannot be undone.')) return;
  try {
    if (!state.demo) await apiRemove(id);
    else {
      state.tasks = state.tasks.filter((t) => t.id !== id);
      demoSave();
    }
    if (state.editingId === id) resetForm();
    await loadTasks();
  } catch (err) {
    showError(err.message);
  }
}

function startEdit(task) {
  state.editingId = task.id;
  el('task-id').value = task.id;
  el('title').value = task.title;
  el('description').value = task.description || '';
  el('priority').value = task.priority;
  el('due_date').value = (task.due_date || '').slice(0, 10);
  el('form-title').textContent = 'Edit Task';
  el('submit-btn').textContent = 'Save Changes';
  el('cancel-btn').classList.remove('hidden');
  el('title').focus();
}

function resetForm() {
  state.editingId = null;
  form.reset();
  el('task-id').value = '';
  el('error-title').textContent = '';
  el('form-title').textContent = 'New Task';
  el('submit-btn').textContent = 'Add Task';
  el('cancel-btn').classList.add('hidden');
}

const nextId = () => state.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;

/* ---------- Rendering ---------- */

const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

function visibleTasks() {
  let rows = state.tasks.slice();

  if (state.filter === 'active') rows = rows.filter((t) => !t.completed);
  if (state.filter === 'completed') rows = rows.filter((t) => t.completed);

  const [key, dir] = state.sort.split('_');
  const sign = dir === 'asc' ? 1 : -1;

  rows.sort((a, b) => {
    if (key === 'priority') return (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * sign;
    if (key === 'due') {
      const av = a.due_date || '9999-12-31';
      const bv = b.due_date || '9999-12-31';
      return (av < bv ? -1 : av > bv ? 1 : 0) * sign;
    }
    return (new Date(a.created_at) - new Date(b.created_at)) * sign;
  });

  return rows;
}

function render() {
  const rows = visibleTasks();
  listEl.innerHTML = rows.map(taskRow).join('');
  emptyEl.classList.toggle('hidden', rows.length > 0);

  el('stat-total').textContent = state.tasks.length;
  el('stat-completed').textContent = state.tasks.filter((t) => t.completed).length;
  el('stat-remaining').textContent = state.tasks.filter((t) => !t.completed).length;
}

function taskRow(task) {
  const done = Boolean(task.completed);
  const due = task.due_date ? 'Due ' + formatDate(task.due_date) : 'No due date';
  const created = 'Created ' + formatDate(task.created_at);

  return '' +
    '<li class="task task--' + task.priority + (done ? ' task--completed' : '') + '">' +
      '<div class="task__head">' +
        '<input type="checkbox" data-action="toggle" data-id="' + task.id + '"' + (done ? ' checked' : '') + ' aria-label="Toggle task" />' +
        '<span class="task__title">' + escapeHtml(task.title) + '</span>' +
        '<span class="tag tag--' + task.priority + '">' + task.priority + '</span>' +
      '</div>' +
      (task.description ? '<p class="task__desc">' + escapeHtml(task.description) + '</p>' : '') +
      '<div class="task__meta"><span>' + due + '</span><span>' + created + '</span></div>' +
      '<div class="task__actions">' +
        '<button class="btn btn--ghost btn--small" data-action="edit" data-id="' + task.id + '">Edit</button>' +
        '<button class="btn btn--ghost btn--small" data-action="delete" data-id="' + task.id + '">Delete</button>' +
      '</div>' +
    '</li>';
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/* ---------- Messages ---------- */

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function hideError() {
  errorEl.classList.add('hidden');
}

function setMode(mode) {
  const badge = el('mode-badge');
  if (mode === 'live') {
    badge.textContent = 'connected to API';
    badge.className = 'badge badge--live';
  } else {
    badge.textContent = 'demo mode - data saved in browser';
    badge.className = 'badge badge--demo';
  }
}

/* ---------- Events ---------- */

form.addEventListener('submit', submitTask);
el('cancel-btn').addEventListener('click', resetForm);

el('sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  render();
});

document.querySelector('.filters').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  document.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  state.filter = btn.dataset.filter;
  render();
});

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.action === 'edit') startEdit(state.tasks.find((t) => t.id === id));
  if (btn.dataset.action === 'delete') deleteTask(id);
});

listEl.addEventListener('change', (e) => {
  const box = e.target.closest('[data-action="toggle"]');
  if (box) toggleTask(state.tasks.find((t) => t.id === Number(box.dataset.id)));
});

loadTasks();