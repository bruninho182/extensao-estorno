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
  // Carregar operador salvo
  chrome.storage.sync.get({ operatorName: '' }, (items) => {
    document.getElementById('operatorName').value = items.operatorName || '';
  });

  // Carregar preferência de modo
  chrome.storage.sync.get({ fullRowMode: false }, (items) => {
    const checkbox = document.getElementById('fullRowMode');
    checkbox.checked = items.fullRowMode;
    toggleModeVisibility();
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

  // Alternar modo
  document.getElementById('fullRowMode').addEventListener('change', (e) => {
    const isFull = e.target.checked;
    chrome.storage.sync.set({ fullRowMode: isFull });
    toggleModeVisibility();
  });

  function toggleModeVisibility() {
    const isFull = document.getElementById('fullRowMode').checked;
    document.getElementById('selectiveButtons').style.display = isFull ? 'none' : 'block';
    document.getElementById('fullRowButton').style.display = isFull ? 'block' : 'none';
  }

  // Botão copiar dados principais (H-L)
  document.getElementById('copyMainBtn').addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    const data = response.collectedData || {};

    // Monta linha com H, I, J, K, L (separados por tab)
    const mainValues = [
      data['H'] || '',
      data['I'] || '',
      data['J'] || '',
      data['K'] || '',
      data['L'] || ''
    ];
    const line = mainValues.join('\t');

    try {
      await navigator.clipboard.writeText(line);
      document.getElementById('status').textContent = 'Dados principais copiados! Vá até a planilha, clique na célula H da linha e cole (Ctrl+V).';
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = line;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      document.getElementById('status').textContent = 'Dados principais copiados (fallback).';
    }
  });

  // Botão copiar e-mail (Q)
  document.getElementById('copyEmailBtn').addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    const data = response.collectedData || {};
    const email = data['Q'] || '';

    try {
      await navigator.clipboard.writeText(email);
      document.getElementById('status').textContent = 'E-mail copiado! Vá até a planilha, clique na célula Q da linha e cole (Ctrl+V).';
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = email;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      document.getElementById('status').textContent = 'E-mail copiado (fallback).';
    }
  });

  // Botão copiar linha completa (A-R)
  document.getElementById('copyFullRowBtn').addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    const collectedData = response.collectedData || {};
    const operatorName = document.getElementById('operatorName').value.trim();
    const currentDate = getCurrentDateBR();

    // Preenche valores fixos e automáticos
    collectedData['B'] = currentDate;
    collectedData['P'] = currentDate;
    collectedData['A'] = 'E-MAIL';
    collectedData['G'] = 'CRÉDITO';
    collectedData['R'] = operatorName;

    // Monta array de A até R (índices 0 a 17)
    const maxCol = 17;
    const rowArray = new Array(maxCol + 1).fill('');
    for (const [col, val] of Object.entries(collectedData)) {
      const idx = col.charCodeAt(0) - 65;
      if (idx >= 0 && idx <= maxCol) {
        rowArray[idx] = val || '';
      }
    }
    const line = rowArray.join('\t');

    try {
      await navigator.clipboard.writeText(line);
      document.getElementById('status').textContent = 'Linha completa copiada! Clique na célula A da linha e cole (Ctrl+V).';
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = line;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      document.getElementById('status').textContent = 'Linha completa copiada (fallback).';
    }
  });

  // Limpar dados
  document.getElementById('clearBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clearData' }, (response) => {
      if (response.success) {
        updateCollectedDisplay({});
        document.getElementById('status').textContent = 'Dados limpos.';
      }
    });
  });
});