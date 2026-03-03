/* api.js — fetch helper, task loading, cache */

import { renderTasks } from './view.js';
import { toast }       from './toast.js';

const API = 'api.php';
let taskCache = {};

export async function apiFetch(method, params = '', body = null) {
  const url  = API + (params ? '?' + params : '');
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    return res.json();
  } catch {
    return { success: false, message: 'Network error. Is the server running?' };
  }
}

export function getCache() { return taskCache; }
export function clearCacheEntry(id) { delete taskCache[id]; }

export async function loadTasks() {
  const params = new URLSearchParams();
  const status   = document.getElementById('filterStatus').value;
  const priority = document.getElementById('filterPriority').value;
  const search   = document.getElementById('searchInput').value.trim();
  if (status)   params.set('status', status);
  if (priority) params.set('priority', priority);
  if (search)   params.set('search', search);

  const data = await apiFetch('GET', params.toString());
  if (!data.success) { toast(data.message || 'Failed to load tasks', 'error'); return; }

  const s = data.stats || {};
  document.getElementById('stat-total').textContent      = s.total       || 0;
  document.getElementById('stat-pending').textContent    = s.pending     || 0;
  document.getElementById('stat-inprogress').textContent = s.in_progress || 0;
  document.getElementById('stat-completed').textContent  = s.completed   || 0;

  taskCache = {};
  (data.tasks || []).forEach(t => { taskCache[t.id] = t; });

  renderTasks(data.tasks || []);
}