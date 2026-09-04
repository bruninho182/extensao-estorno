// content/icd.js

function findDateByLabel(labelText) {
  const tds = document.querySelectorAll('td');
  for (let td of tds) {
    if (td.textContent.trim().includes(labelText)) {
      const nextTd = td.nextElementSibling;
      if (nextTd) {
        const fullText = nextTd.textContent.trim();
        // Retorna somente a data (dd/mm/aaaa)
        return fullText.substring(0, 10);
      }
    }
  }
  return '';
}

function extractDates() {
  const dataCompra = findDateByLabel('Data e Hora da Venda');
  const dataVisita = findDateByLabel('Data e Hora da Entrega');
  return { dataCompra, dataVisita };
}

function createButton() {
  if (document.getElementById('collect-icd-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'collect-icd-btn';
  btn.textContent = 'Coletar datas (compra e visita)';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '99999';
  btn.style.padding = '10px 15px';
  btn.style.backgroundColor = '#2196F3';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.borderRadius = '5px';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  btn.addEventListener('click', () => {
    const dates = extractDates();
    if (!dates.dataCompra && !dates.dataVisita) {
      alert('Não foi possível encontrar as datas. Verifique se a página do pedido está aberta.');
      return;
    }
    chrome.runtime.sendMessage({
      action: 'collectData',
      data: {
        J: dates.dataCompra || '',
        K: dates.dataVisita || ''
      }
    }, (response) => {
      if (response && response.success) {
        alert('Datas coletadas!');
      } else {
        alert('Erro ao coletar: ' + (response?.error || 'desconhecido'));
      }
    });
  });
  document.body.appendChild(btn);
}

function init() {
  createButton();
  const observer = new MutationObserver(() => {
    if (!document.getElementById('collect-icd-btn')) {
      createButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
} 