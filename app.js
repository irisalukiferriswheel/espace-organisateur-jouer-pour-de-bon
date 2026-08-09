const createEventBtn = document.querySelector('#createEventBtn');
const closeCreateBtn = document.querySelector('#closeCreateBtn');
const createPanel = document.querySelector('#createPanel');
const emptyState = document.querySelector('#emptyState');
const eventForm = document.querySelector('#eventForm');
const saveDraftBtn = document.querySelector('#saveDraftBtn');
const formMessage = document.querySelector('#formMessage');
const previewTitle = document.querySelector('#previewTitle');
const previewSummary = document.querySelector('#previewSummary');

function openCreatePanel() {
  createPanel.hidden = false;
  emptyState.hidden = true;
  createPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCreatePanel() {
  createPanel.hidden = true;
  emptyState.hidden = false;
}

function getFormData() {
  return Object.fromEntries(new FormData(eventForm).entries());
}

function updatePreview() {
  const data = getFormData();
  previewTitle.textContent = data.title || 'Votre événement';

  const parts = [
    data.activityType,
    data.city,
    data.date,
    data.startTime,
    data.fee ? `${data.fee} ${data.currency || 'CAD'}` : ''
  ].filter(Boolean);

  previewSummary.textContent = parts.length
    ? parts.join(' · ')
    : 'Remplissez le nom, la ville et la date pour voir un résumé ici.';
}

function showPrototypeMessage(message) {
  formMessage.textContent = message;
}

function handleDraft() {
  const data = getFormData();
  console.log('Prototype draft payload:', data);
  showPrototypeMessage('Brouillon simulé. Aucune donnée réelle n’a été enregistrée.');
}

function handleSubmit(event) {
  event.preventDefault();

  if (!eventForm.reportValidity()) return;

  const data = getFormData();
  console.log('Prototype publish payload:', data);
  showPrototypeMessage('Publication simulée. L’API sécurisée sera connectée à l’étape suivante.');
}

createEventBtn?.addEventListener('click', openCreatePanel);
closeCreateBtn?.addEventListener('click', closeCreatePanel);
saveDraftBtn?.addEventListener('click', handleDraft);
eventForm?.addEventListener('submit', handleSubmit);
eventForm?.addEventListener('input', updatePreview);
eventForm?.addEventListener('change', updatePreview);
