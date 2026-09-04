// content/sheets.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'insertData') {
    insertData(request.data, request.row)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // manter canal aberto
  }
});

async function insertData(data, row) {
  // Mapeamento de colunas para letras
  const columns = ['D', 'H', 'I', 'J', 'K', 'L', 'P'];
  const colValues = {};
  for (const col of columns) {
    if (data[col]) colValues[col] = data[col];
  }

  // Se a linha não foi fornecida, tentar obter a linha da célula ativa
  if (!row) {
    row = getActiveRow();
    if (!row) {
      throw new Error('Não foi possível determinar a linha. Selecione uma célula da coluna A da linha desejada ou informe o número da linha no popup.');
    }
  }

  // Para cada coluna, navegar até a célula alvo e inserir o valor
  for (const col of Object.keys(colValues)) {
    const cell = findCellByColumnAndRow(col, row);
    if (cell) {
      setCellValue(cell, colValues[col]);
    } else {
      console.warn(`Célula ${col}${row} não encontrada`);
    }
  }
}

function getActiveRow() {
  // Tenta obter a linha da célula ativa através da seleção
  const selection = document.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    // Encontrar a célula da tabela que contém a seleção
    const cellElement = container.nodeType === Node.TEXT_NODE ? container.parentElement.closest('td') : container.closest('td');
    if (cellElement) {
      // O número da linha pode ser extraído do atributo data-row ou similar
      // Como o Google Sheets não expõe diretamente, vamos tentar pela posição
      const rowElement = cellElement.closest('tr');
      if (rowElement) {
        const rowIndex = Array.from(rowElement.parentNode.children).indexOf(rowElement) + 1;
        return rowIndex;
      }
    }
  }
  return null;
}

function findCellByColumnAndRow(colLetter, row) {
  // Mapear coluna para índice numérico (A=1, B=2, ...)
  const colIndex = letterToColumnIndex(colLetter);
  // No Google Sheets, a grade é renderizada em uma tabela (ou conjunto de divs)
  // Estratégia: procurar a célula pela posição relativa
  // Isso é complexo e varia; um método alternativo é usar a barra de fórmulas e simular navegação
  // Vamos tentar localizar a célula ativa e navegar com teclado (setas) para a coluna desejada
  // Mas como isso é limitado, usaremos a abordagem de simular digitação direta na célula ativa após navegação
  // Para simplificar, assumiremos que a célula ativa é A{row} e navegaremos horizontalmente até a coluna desejada
  return navigateToColumn(colLetter, row);
}

function navigateToColumn(colLetter, row) {
  // Calcula quantas colunas de deslocamento a partir da coluna A
  const targetColIndex = letterToColumnIndex(colLetter);
  // A célula ativa deve estar na coluna A da mesma linha (ou precisamos navegar)
  // Enviar eventos de teclado para mover para a direita (ou esquerda) e depois digitar
  // Essa função retorna um objeto com método setCellValue? Não, será manipulado externamente.
  // Na prática, usaremos document.execCommand('insertText') após focar na célula correta
  // Vamos criar um fluxo: focar na célula ativa, navegar até a coluna, e então inserir o valor.
  return { colLetter, row, colIndex: targetColIndex };
}

function setCellValue(cell, value) {
  // Implementação simplificada: se recebermos um objeto de navegação, executamos a sequência
  if (cell && cell.colLetter) {
    const { colIndex, row } = cell;
    // Supondo que a célula ativa seja A{row}, precisamos mover para a coluna desejada
    const diff = colIndex - 1; // número de setas para a direita
    if (diff > 0) {
      // Enviar setas para a direita
      for (let i = 0; i < diff; i++) {
        simulateKey('ArrowRight');
      }
    }
    // Agora digitar o valor
    simulateType(value);
  } else {
    console.warn('Método setCellValue não implementado para este tipo de célula');
  }
}

function simulateKey(key) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  document.activeElement.dispatchEvent(event);
}

function simulateType(text) {
  document.execCommand('insertText', false, text);
}

function letterToColumnIndex(letter) {
  let column = 0;
  for (let i = 0; i < letter.length; i++) {
    column = column * 26 + (letter.charCodeAt(i) - 64);
  }
  return column;
}