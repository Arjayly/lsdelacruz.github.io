/* main.js — app entry point */

import { loadTasks }             from './api.js';
import { openModal, closeModal, saveTask } from './modal.js';
import { confirmDelete, closeConfirm, doDelete } from './delete.js';
import { toast }                 from './toast.js';

let searchTimer;

function handleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadTasks, 350);
}

async function toggleComplete(id, currentStatus) {
  const { apiFetch } = await import('./api.js');
  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  const data = await apiFetch('PUT', `id=${id}`, { status: newStatus });
  if (data.success) {
    toast(newStatus === 'completed' ? '✓ Task completed!' : 'Task reopened', 'info');
    loadTasks();
  } else {
    toast('Failed to update', 'error');
  }
}

/* Expose to inline HTML onclick handlers */
window.openModal      = openModal;
window.closeModal     = closeModal;
window.saveTask       = saveTask;
window.confirmDelete  = confirmDelete;
window.closeConfirm   = closeConfirm;
window.toggleComplete = toggleComplete;
window.handleSearch   = handleSearch;
window.loadTasks      = loadTasks;

/* Close modals on backdrop click */
document.getElementById('taskModal').addEventListener('click',    e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('confirmModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeConfirm(); });

/* Delete button */
document.getElementById('confirmDeleteBtn').addEventListener('click', doDelete);

/* Keyboard shortcuts */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openModal(); }
});

loadTasks();
