const createEventBtn = document.querySelector('#createEventBtn');
const closeCreateBtn = document.querySelector('#closeCreateBtn');
const createPanel = document.querySelector('#createPanel');
const emptyState = document.querySelector('#emptyState');

function openCreatePanel() {
  createPanel.hidden = false;
  emptyState.hidden = true;
  createPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCreatePanel() {
  createPanel.hidden = true;
  emptyState.hidden = false;
}

createEventBtn?.addEventListener('click', openCreatePanel);
closeCreateBtn?.addEventListener('click', closeCreatePanel);
