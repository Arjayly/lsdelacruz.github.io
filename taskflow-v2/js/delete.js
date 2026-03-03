/* delete.js — delete confirmation modal */

import { apiFetch, getCache, clearCacheEntry, loadTasks } from './api.js';
import { toast } from './toast.js';

let pendingDeleteId = null;

export function confirmDelete(id) {
  pendingDeleteId = id;
  const task = getCache()[id];
  document.getElementById('confirmTaskId').textContent    = id;
  document.getElementById('confirmTaskTitle').textContent = task ? task.title : '(loading...)';
  document.getElementById('confirmModal').classList.add('open');
}

export function closeConfirm() {
  pendingDeleteId = null;
  document.getElementById('confirmModal').classList.remove('open');
}

export async function doDelete() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  closeConfirm();

  const data = await apiFetch('DELETE', `id=${id}`);
  if (data.success) {
    toast(`Task #${id} deleted successfully`, 'success');
    clearCacheEntry(id);
    loadTasks();
  } else {
    toast(data.message || 'Delete failed', 'error');
  }
}
