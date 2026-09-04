// content/pagarme.js

function extractGatewayData() {
  // Função auxiliar para encontrar o valor de um item da lista pelo rótulo
  function getValueByLabel(labelText) {
    const items = document.querySelectorAll('.jade-list-item, [class*="list-item"]');
    for (const item of items) {
      const labelElement = Array.from(item.querySelectorAll('*')).find(el =>
        el.textContent.trim() === labelText || el.textContent.trim().includes(labelText)
      );
      if (labelElement) {
        const trailing = item.querySelector('[class*="trailing"]');
        if (trailing) {
          const valueDiv = trailing.querySelector('div.sc-csCMJq.dPGAJk');
          if (valueDiv) {
            return valueDiv.childNodes[0]?.textContent?.trim() || valueDiv.textContent.trim();
          }
        }
        if (labelElement.nextElementSibling) {
          return labelElement.nextElementSibling.textContent.trim();
        }
      }
    }
    return '';
  }

  // Extrai NSU e adquirente (como antes)
  let nsu = getValueByLabel('NSU') || getValueByLabel('Autorização') || getValueByLabel('Código de autorização');
  let adquirenteRaw = getValueByLabel('Adquirente') || getValueByLabel('Bandeira') || getValueByLabel('Instituição');

  // Fallback para NSU
  if (!nsu) {
    const copyDivs = Array.from(document.querySelectorAll('div.sc-csCMJq.dPGAJk')).filter(div =>
      div.querySelector('button[aria-label="action-copy"]')
    );
    if (copyDivs.length > 0) {
      nsu = copyDivs[0].childNodes[0]?.textContent?.trim() || '';
    }
  }

  // Fallback para adquirente
  if (!adquirenteRaw) {
    const knownAcquirers = ['redecard', 'cielo', 'stone', 'rede', 'getnet', 'amex', 'visa', 'mastercard', 'elo', 'hipercard'];
    const allDivs = Array.from(document.querySelectorAll('div.sc-csCMJq.dPGAJk')).filter(div =>
      !div.querySelector('button[aria-label="action-copy"]') && div.textContent.trim() !== ''
    );
    for (const div of allDivs) {
      const text = div.textContent.trim().toLowerCase();
      if (knownAcquirers.some(name => text.includes(name))) {
        adquirenteRaw = div.textContent.trim();
        break;
      }
    }
  }

  // Normaliza adquirente para os valores aceitos
  function normalizeAcquirer(raw) {
    const upper = raw.trim().toUpperCase();
    if (upper.includes('REDE')) return 'REDE';
    if (upper.includes('CIELO')) return 'CIELO';
    if (upper.includes('STONE')) return 'STONE';
    // Se não reconhecer, retorna o texto original em maiúsculas
    return upper;
  }

  const adquirente = normalizeAcquirer(adquirenteRaw || '');

  // NOVA extração do valor total da transação
  let valor = '';
  const valorContainer = document.querySelector('div.sc-kFuwaQ');
  if (valorContainer) {
    const valorElement = valorContainer.querySelector('p.is-display-small');
    if (valorElement) {
      valor = valorElement.textContent.trim();
    } else {
      const allP = valorContainer.querySelectorAll('p');
      for (const p of allP) {
        if (p.textContent.includes('R$')) {
          valor = p.textContent.trim();
          break;
        }
      }
    }
  }

  // Extrai e-mail (ainda usando a função de rótulo ou fallback)
  let email = getValueByLabel('E-mail') || getValueByLabel('Email') || getValueByLabel('Cliente');

  return { adquirente, nsu, valor, email };
}

function createButton() {
  if (document.getElementById('collect-gateway-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'collect-gateway-btn';
  btn.textContent = 'Coletar dados do Gateway';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '99999';
  btn.style.padding = '10px 15px';
  btn.style.backgroundColor = '#4CAF50';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.borderRadius = '5px';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  btn.addEventListener('click', () => {
    const data = extractGatewayData();
    if (!data.adquirente && !data.nsu && !data.valor && !data.email) {
      alert('Não foi possível extrair os dados. Verifique se a página da cobrança está aberta.');
      return;
    }
    const sheetData = {
      H: data.adquirente,
      I: data.nsu,
      L: data.valor,
      Q: data.email
    };
    chrome.runtime.sendMessage({
      action: 'collectData',
      data: sheetData
    }, (response) => {
      if (response && response.success) {
        alert('Dados do Gateway coletados!');
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
    if (!document.getElementById('collect-gateway-btn')) {
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