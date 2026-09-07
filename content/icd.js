// content/icd.js

function extractDatesFromRow(row) {
  const cells = Array.from(row.querySelectorAll('td'));
  let dataCompra = '';
  let dataVisita = '';
  
  for (let i = 0; i < cells.length; i++) {
    const cellText = cells[i].textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    
    if (cellText.includes('data e hora da venda')) {
      // Procura a data nas células seguintes da mesma linha
      for (let j = i + 1; j < cells.length; j++) {
        const candidate = cells[j].textContent.trim();
        const match = candidate.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (match) {
          dataCompra = match[1];
          break;
        }
      }
    }
    
    if (cellText.includes('data e hora da visita')) {
      for (let j = i + 1; j < cells.length; j++) {
        const candidate = cells[j].textContent.trim();
        const match = candidate.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (match) {
          dataVisita = match[1];
          break;
        }
      }
    }
  }
  
  return { dataCompra, dataVisita };
}

function extractDates() {
  // Percorre todas as linhas da página
  const rows = document.querySelectorAll('tr');
  for (const row of rows) {
    const rowText = row.textContent.toLowerCase();
    // Verifica se a linha contém AMBOS os rótulos de venda e visita
    if (rowText.includes('data e hora da venda') && rowText.includes('data e hora da visita')) {
      return extractDatesFromRow(row);
    }
  }
  
  // Fallback: se não encontrar uma linha com ambos, tenta o método antigo
  let dataCompra = '';
  let dataVisita = '';
  const allTds = document.querySelectorAll('td');
  for (let i = 0; i < allTds.length; i++) {
    const tdText = allTds[i].textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    if (tdText.includes('data e hora da venda')) {
      for (let j = i + 1; j < allTds.length; j++) {
        const match = allTds[j].textContent.trim().match(/(\d{2}\/\d{2}\/\d{4})/);
        if (match) {
          dataCompra = match[1];
          break;
        }
      }
    }
    if (tdText.includes('data e hora da visita')) {
      for (let j = i + 1; j < allTds.length; j++) {
        const match = allTds[j].textContent.trim().match(/(\d{2}\/\d{2}\/\d{4})/);
        if (match) {
          dataVisita = match[1];
          break;
        }
      }
    }
  }
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
    console.log('Datas extraídas:', dates);
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