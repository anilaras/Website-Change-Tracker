chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "extractContent") {
      let content;
      
      if (request.selector) {
        const selectedElement = document.querySelector(request.selector);
        if (selectedElement) {
          content = selectedElement.innerHTML.trim();
        } else {
          content = document.body.innerHTML.trim();
        }
      } else {
        content = document.body.innerHTML.trim();
      }
      
      sendResponse({content: content});
    }
    return true; // Asenkron yanıt için
  });
  