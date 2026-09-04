// popup.js

function updateCollectedDisplay(data) {
  const infoDiv = document.getElementById('collectedInfo');
  if (!data || Object.keys(data).length === 0) {
    infoDiv.textContent = 'Nenhum dado coletado.';
    return;
  }
  let html = '<ul>';
  const colNames = {
    B: 'Data Solicitação',
    H: 'Adquirente',
    I: 'NSU',
    J: 'Data Compra',
    K: 'Data Visita',
    L: 'Valor Transação',
    P: 'Data Estorno',
    Q: 'E-mail Cliente'
  };
  for (const [col, val] of Object.entries(data)) {
    html += `<li><strong>${colNames[col] || col}:</strong> ${val}</li>`;
  }
  html += '</ul>';
  infoDiv.innerHTML = html;
}

function getCurrentDateBR() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

document.addEventListener('DOMContentLoaded', () => {
  // Carregar nome do operador salvo
  chrome.storage.sync.get({ operatorName: '' }, (items) => {
    document.getElementById('operatorName').value = items.operatorName || '';
  });

  // Carregar dados coletados
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    updateCollectedDisplay(response.collectedData);
  });

  // Salvar operador
  document.getElementById('saveOperatorBtn').addEventListener('click', () => {
    const name = document.getElementById('operatorName').value.trim();
    chrome.storage.sync.set({ operatorName: name }, () => {
      document.getElementById('status').textContent = 'Operador salvo!';
    });
  });

  // Botão copiar linha
  document.getElementById('copyBtn').addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    const collectedData = response.collectedData || {};

    // Obtém nome do operador (do input, já salvo ou não)
    const operatorName = document.getElementById('operatorName').value.trim();

    // Adiciona datas atuais para B e P
    const currentDate = getCurrentDateBR();
    collectedData['B'] = currentDate;
    collectedData['P'] = currentDate;

    // Monta a linha TSV para colunas A..R (18 colunas, índices 0 a 17)
    const maxCol = 17; // R = 17
    const rowArray = new Array(maxCol + 1).fill('');

    // Coloca os valores coletados nas posições correspondentes
    for (const [col, val] of Object.entries(collectedData)) {
      const idx = col.charCodeAt(0) - 65; // A=0, B=1, ..., R=17
      if (idx >= 0 && idx <= maxCol) {
        rowArray[idx] = val || '';
      }
    }

    // Valores fixos
    rowArray[0] = 'E-MAIL';   // Coluna A
    rowArray[6] = 'CRÉDITO';  // Coluna G

    // Coluna R (índice 17) recebe o nome do operador
    rowArray[17] = operatorName;

    const line = rowArray.join('\t');

    try {
      await navigator.clipboard.writeText(line);
      document.getElementById('status').textContent = 'Linha copiada! Vá até a planilha, clique na célula A da linha desejada e cole (Ctrl+V).';
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = line;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      document.getElementById('status').textContent = 'Linha copiada (fallback).';
    }
  });

  // Botão limpar dados
  document.getElementById('clearBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clearData' }, (response) => {
      if (response.success) {
        updateCollectedDisplay({});
        document.getElementById('status').textContent = 'Dados limpos.';
      }
    });
  });
});