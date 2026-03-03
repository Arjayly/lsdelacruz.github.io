/* toast.js — notification toasts */

export function toast(msg, type = 'success') {
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3400);
}
