/* view.js — renders the task list */

import { loadTasks } from './api.js';
import { openModal }  from './modal.js';
import { confirmDelete } from './delete.js';

export function renderTasks(tasks) {
  const list = document.getElementById('taskList');

  if (!tasks.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No tasks found</h3>
        <p>Create a new task or clear your filters</p>
      </div>`;
    return;
  }

  const pColor = { high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)' };
  const today  = new Date().toISOString().split('T')[0];

  list.innerHTML = tasks.map(t => {
    const done    = t.status === 'completed';
    const overdue = t.due_date && t.due_date < today && !done;
    const dueStr  = t.due_date ? formatDate(t.due_date) : '';

    return `
    <div class="task-card ${done ? 'completed-card' : ''}"
         id="task-${t.id}"
         style="--priority-color:${pColor[t.priority]}">

      <div class="task-check ${done ? 'checked' : ''}"
           onclick="window.toggleComplete(${t.id},'${t.status}')"
           title="Toggle completion"></div>

      <div class="task-body">
        <div class="task-title">${escHtml(t.title)}</div>
        ${t.description ? `<div class="task-desc">${escHtml(t.description)}</div>` : ''}
        <div class="task-meta">
          <span class="badge badge-priority-${t.priority}">${t.priority}</span>
          <span class="badge badge-status-${t.status}">${t.status.replace('_',' ')}</span>
          ${dueStr ? `<span class="task-due ${overdue ? 'overdue' : ''}">
            ${overdue ? '⚠' : '📅'} ${dueStr}
          </span>` : ''}
          <span class="task-id-pill">#${t.id}</span>
        </div>
      </div>

      <div class="task-actions">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="window.openModal(${t.id})" title="Edit task #${t.id}">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="window.confirmDelete(${t.id})" title="Delete task #${t.id}">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');
}

export function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

export function formatDate(d) {
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
