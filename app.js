'use strict';

const form = document.querySelector('form');
const client = document.querySelector('#cliente');
const target = document.querySelector('#valor-final');
const other = document.querySelector('#outros');
const feedback = document.querySelector('#fechamento');
const initialFeedback = feedback.textContent;
let manualOther = '';
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

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function money(value) {
  return currency.format(value / 100);
}

function updateTotal() {
  const automatic = target.value.trim() !== '';
  if (automatic && !other.readOnly) manualOther = other.value;
  if (!automatic && other.readOnly) other.value = manualOther;
  other.readOnly = automatic;

  const parsed = fields.map(field => {
    const value = field === other && automatic ? 0 : cents(field.value);
    field.setCustomValidity(Number.isNaN(value) ? 'Digite um valor em reais, como 123,45.' : '');
    return value;
  });
  const subtotal = sum(parsed);
  let error = '';
  let message = initialFeedback;
  if (automatic) {
    const targetValue = cents(target.value);
    const remaining = targetValue - subtotal;
    if (Number.isNaN(targetValue)) {
      error = 'Digite um valor final em reais, como 850,00.';
    } else if (remaining < 0) {
      error = 'Os serviços ultrapassam o valor final em ' + money(-remaining) + '.';
    } else if (Number.isNaN(subtotal)) {
      message = 'Corrija os valores dos serviços para calcular “Outros”.';
    } else {
      message = 'Subtotal dos serviços: ' + money(subtotal) + '. Outros calculado: ' + money(remaining) + '.';
    }
    const valid = Number.isFinite(remaining) && remaining >= 0;
    other.value = valid ? (remaining / 100).toFixed(2).replace('.', ',') : '';
    parsed[fields.indexOf(other)] = valid ? remaining : NaN;
  }
  target.setCustomValidity(error);
  feedback.classList.toggle('erro', Boolean(error));
  feedback.textContent = error || message;
  const total = sum(parsed);
  form.querySelector('.total strong').textContent = Number.isNaN(total) ? '—' : money(total);
  return parsed;
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
  target.setCustomValidity('');
  other.readOnly = false;
  manualOther = '';
  feedback.textContent = initialFeedback;
  feedback.classList.remove('erro');
  clearPreview();
  form.querySelector('.total strong').textContent = currency.format(0);
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const name = client.value.trim();
  const values = updateTotal();
  client.setCustomValidity(name ? '' : 'Informe o nome do cliente.');
  if (!form.reportValidity()) return;

  const label = document.createElement('b');
  label.textContent = 'Cliente';
  preview.querySelector('.paper > p').replaceChildren(label, document.createElement('br'), name);
  values.forEach((value, index) => {
    amountCells[index].textContent = fields[index].value.trim() ? money(value) : '—';
  });
  preview.querySelector('.total strong').textContent = money(sum(values));
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
