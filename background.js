let collectedData = {}; // { coluna: valor }

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'collectData') {
    collectedData = { ...collectedData, ...request.data };
    sendResponse({ success: true, collectedData });
    return;
  }
  if (request.action === 'clearData') {
    collectedData = {};
    sendResponse({ success: true });
    return;
  }
  if (request.action === 'getState') {
    sendResponse({ collectedData });
    return;
  }
});