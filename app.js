'use strict';

const form = document.querySelector('form');
const client = document.querySelector('#cliente');
const fields = Array.from(form.querySelectorAll('.field'));
const preview = document.querySelector('#previa');
const amountCells = preview.querySelectorAll('tbody td:last-child');
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const date = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Bahia' });

function cents(value) {
  const clean = value.trim();
  if (!clean) return 0;
  if (!/^(?:\d{1,9}|\d{1,3}(?:\.\d{3}){1,2})(?:,\d{1,2})?$/.test(clean)) return NaN;
  const [whole, fraction = ''] = clean.replaceAll('.', '').split(',');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

function amounts() {
  return fields.map(field => {
    const value = cents(field.value);
    field.setCustomValidity(Number.isNaN(value) ? 'Digite um valor em reais, como 123,45.' : '');
    return value;
  });
}

function updateTotal() {
  const values = amounts();
  form.querySelector('.total strong').textContent = values.some(Number.isNaN)
    ? '—'
    : currency.format(values.reduce((sum, value) => sum + value, 0) / 100);
}

function clearPreview() {
  preview.hidden = true;
  preview.querySelector('.paper > p').replaceChildren();
  preview.querySelector('.date').textContent = '';
  preview.querySelector('.total strong').textContent = currency.format(0);
  amountCells.forEach(cell => { cell.textContent = '—'; });
}

form.addEventListener('input', () => {
  client.setCustomValidity('');
  updateTotal();
  clearPreview();
});

form.addEventListener('reset', () => {
  client.setCustomValidity('');
  fields.forEach(field => field.setCustomValidity(''));
  clearPreview();
  form.querySelector('.total strong').textContent = currency.format(0);
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const name = client.value.trim();
  const values = amounts();
  client.setCustomValidity(name ? '' : 'Informe o nome do cliente.');
  if (!form.reportValidity()) return;

  const label = document.createElement('b');
  label.textContent = 'Cliente';
  preview.querySelector('.paper > p').replaceChildren(label, document.createElement('br'), name);
  values.forEach((value, index) => {
    amountCells[index].textContent = fields[index].value.trim() ? currency.format(value / 100) : '—';
  });
  preview.querySelector('.total strong').textContent = currency.format(values.reduce((sum, value) => sum + value, 0) / 100);
  preview.querySelector('.date').textContent = 'Data de emissão · ' + date.format(new Date());
  preview.hidden = false;
  document.querySelector('#imprimir').focus();
});

document.querySelector('#imprimir').addEventListener('click', () => window.print());
document.querySelector('#finalizar').addEventListener('click', () => {
  form.reset();
  client.focus();
});

window.addEventListener('pageshow', () => form.reset());
