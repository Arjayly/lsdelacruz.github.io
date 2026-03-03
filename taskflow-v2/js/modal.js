/* modal.js — add / edit task modal */

import { apiFetch, getCache, loadTasks } from './api.js';
import { toast } from './toast.js';

export function openModal(id = null) {
  document.getElementById('taskId').value = id || '';
  document.getElementById('modalTitle').textContent = id ? `Edit Task — #${id}` : 'New Task';

  if (id) {
    const t = getCache()[id];
    if (t) {
      fillForm(t);
    } else {
      apiFetch('GET', `id=${id}`).then(data => {
        if (!data.success) { toast('Failed to load task', 'error'); return; }
        fillForm(data.task);
      });
    }
  } else {
    document.getElementById('taskTitle').value    = '';
    document.getElementById('taskDesc').value     = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskStatus').value   = 'pending';
    document.getElementById('taskDue').value      = '';
  }

  document.getElementById('taskModal').classList.add('open');
  setTimeout(() => document.getElementById('taskTitle').focus(), 280);
}

function fillForm(t) {
  document.getElementById('taskTitle').value    = t.title;
  document.getElementById('taskDesc').value     = t.description || '';
  document.getElementById('taskPriority').value = t.priority;
  document.getElementById('taskStatus').value   = t.status;
  document.getElementById('taskDue').value      = t.due_date || '';
}

export function closeModal() {
  document.getElementById('taskModal').classList.remove('open');
}

export async function saveTask() {
  const id    = document.getElementById('taskId').value;
  const title = document.getElementById('taskTitle').value.trim();

  if (!title) {
    const el = document.getElementById('taskTitle');
    el.focus();
    el.style.borderColor = 'var(--high)';
    setTimeout(() => el.style.borderColor = '', 1600);
    toast('Task title is required', 'error');
    return;
  }

  const body = {
    title,
    description: document.getElementById('taskDesc').value,
    priority:    document.getElementById('taskPriority').value,
    status:      document.getElementById('taskStatus').value,
    due_date:    document.getElementById('taskDue').value,
  };

  const data = id
    ? await apiFetch('PUT',  `id=${id}`, body)
    : await apiFetch('POST', '',         body);

  if (data.success) {
    closeModal();
    toast(data.message, 'success');
    loadTasks();
  } else {
    toast(data.message || 'Something went wrong', 'error');
  }
}
