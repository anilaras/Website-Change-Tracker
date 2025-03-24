// background.js
// Background script'in aktif kalmasını sağlayan bir keep-alive fonksiyonu
let keepAliveInterval;

// Eklenti kurulduğunda
chrome.runtime.onInstalled.addListener(function() {
  console.log('Site Değişiklik Takipçisi kuruldu.');
  
  // Varsayılan değerleri ayarla
  chrome.storage.sync.get(['trackedSites', 'preferredLanguage'], function(result) {
    if (!result.trackedSites) {
      chrome.storage.sync.set({trackedSites: []});
    }
    
    if (!result.preferredLanguage) {
      chrome.storage.sync.set({preferredLanguage: 'tr'});
    }
  });
  
  // Background script'i aktif tutmak için periyodik alarm kur
  chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
  
// Service worker'ın başlatıldığını bildir
console.log('Service worker başlatıldı!');
});

// Service worker'ın aktif olduğunu bildir
console.log('Service worker yüklendi ve çalışıyor!');

// Keep-alive alarmını dinle
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'keepAlive') {
    // Service worker'ın aktif kalmasını sağlamak için boş bir işlem yap
    console.log('Background service worker aktif: ' + new Date().toISOString());
    
    // Service worker'ın aktif olduğunu kaydet
    chrome.storage.local.set({lastActive: new Date().toISOString()});
  } else {
    // Diğer alarmlar için site kontrolü yap
    const siteId = alarm.name;
    
    // İlgili site bilgilerini getir
    chrome.storage.sync.get(['trackedSites', 'preferredLanguage'], function(result) {
      const trackedSites = result.trackedSites || [];
      const site = trackedSites.find(site => site.id === siteId);
      
      if (site) {
        checkForChanges(site, result.preferredLanguage || 'tr');
      }
    });
  }
});

/**
 * HTML içeriğinden CSS seçicisine göre belirli bir elementin içeriğini çıkarır
 * @param {string} html - HTML içeriği
 * @param {string} selector - CSS seçicisi (sadece temel seçiciler desteklenir: tag, #id, .class)
 * @return {string} - Bulunan elementin içeriği veya boş seçici durumunda tüm HTML
 */
function extractElementContent(html, selector) {
  // Boş seçici kontrolü
  if (!selector || selector.trim() === '') {
    return html;
  }

  // Kendi kendine kapanan etiketlerin listesi
  const selfClosingTags = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ];

  // HTML içinde bulunan tüm açılış ve kapanış etiketlerini bul
  const tagPattern = /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z0-9-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+))?)*)\s*>|<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/g;
  
  // HTML'i tagle başlayan parçalara böl
  const parts = [];
  let match;
  
  while ((match = tagPattern.exec(html)) !== null) {
    // Açılış etiketi
    if (match[1]) {
      // Öznitelikleri ayrıştır
      const attributes = {};
      const attrPattern = /([a-zA-Z0-9-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
      let attrMatch;
      
      while ((attrMatch = attrPattern.exec(match[2] || '')) !== null) {
        const name = attrMatch[1].toLowerCase();
        const value = attrMatch[2] || attrMatch[3] || attrMatch[4] || '';
        attributes[name] = value;
      }
      
      parts.push({
        type: 'openTag',
        tag: match[1].toLowerCase(),
        attributes: attributes,
        index: match.index,
        endIndex: match.index + match[0].length
      });
    } 
    // Kapanış etiketi
    else if (match[3]) {
      parts.push({
        type: 'closeTag',
        tag: match[3].toLowerCase(),
        index: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }
  
  // Etiketlerin hiyerarşisini oluştur
  const tagStack = [];
  const elements = [];
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Açılış etiketi
    if (part.type === 'openTag') {
      // Kendi kendine kapanan etiketleri atla
      if (selfClosingTags.includes(part.tag)) {
        continue;
      }
      
      tagStack.push({
        tag: part.tag,
        attributes: part.attributes,
        startIndex: part.endIndex,
        children: []
      });
    } 
    // Kapanış etiketi
    else if (part.type === 'closeTag') {
      if (tagStack.length === 0) continue;
      
      // Son açılan etiketi bul
      let lastOpenedIndex = tagStack.length - 1;
      while (lastOpenedIndex >= 0 && tagStack[lastOpenedIndex].tag !== part.tag) {
        lastOpenedIndex--;
      }
      
      // Uygun eşleşme bulunamazsa geç
      if (lastOpenedIndex < 0) continue;
      
      const openElement = tagStack[lastOpenedIndex];
      openElement.endIndex = part.index;
      openElement.content = html.substring(openElement.startIndex, openElement.endIndex);
      
      // Tamamlanan elementi ekle
      elements.push(openElement);
      
      // Stack'ten kaldır
      tagStack.splice(lastOpenedIndex);
    }
  }
  
  // Seçici parçalarını analiz et
  const selectorParts = selector.trim().split(/\s+/).filter(s => s);
  let matchedElements = [...elements];
  
  for (const selectorPart of selectorParts) {
    let newMatches = [];
    
    // ID seçici (#id)
    if (selectorPart.startsWith('#')) {
      const id = selectorPart.substring(1);
      for (const element of matchedElements) {
        if (element.attributes.id === id) {
          newMatches.push(element);
        }
      }
    } 
    // Class seçici (.class)
    else if (selectorPart.startsWith('.')) {
      const className = selectorPart.substring(1);
      for (const element of matchedElements) {
        const classAttr = element.attributes.class || '';
        const classes = classAttr.split(/\s+/).filter(c => c);
        if (classes.includes(className)) {
          newMatches.push(element);
        }
      }
    } 
    // Etiket seçici (div, span, vb.)
    else {
      for (const element of matchedElements) {
        if (element.tag === selectorPart.toLowerCase()) {
          newMatches.push(element);
        }
      }
    }
    
    matchedElements = newMatches;
    if (matchedElements.length === 0) break;
  }
  
  // Sonucu döndür
  if (matchedElements.length > 0) {
    return matchedElements[0].content;
  }
  
  console.warn(`"${selector}" seçicisi için eşleşme bulunamadı.`);
  return html; // Eşleşme bulunamazsa tüm içeriği döndür
}

// İçerik çekme ve değişiklikleri kontrol etme
function checkForChanges(site, language) {
  const translations = {
    'tr': {
      checkingChanges: '{0} kontrol ediliyor...',
      errorCheckingSite: '{0} kontrol edilirken hata oluştu:',
      notificationTitle: 'Değişiklik Tespit Edildi!',
      notificationMessage: '{0} sitesinde değişiklik tespit edildi.',
      notificationErrorTitle: 'Site Kontrol Hatası',
      notificationErrorMessage: '{0} sitesi kontrol edilirken bir hata oluştu.'
    },
    'en': {
      checkingChanges: 'Checking {0}...',
      errorCheckingSite: 'Error checking {0}:',
      notificationTitle: 'Change Detected!',
      notificationMessage: 'Change detected on {0}.',
      notificationErrorTitle: 'Website Check Error',
      notificationErrorMessage: 'An error occurred while checking {0}.'
    },
    'de': {
      checkingChanges: 'Überprüfe {0}...',
      errorCheckingSite: 'Fehler beim Überprüfen von {0}:',
      notificationTitle: 'Änderung erkannt!',
      notificationMessage: 'Änderung auf {0} erkannt.',
      notificationErrorTitle: 'Fehler bei Webseiten-Überprüfung',
      notificationErrorMessage: 'Beim Überprüfen von {0} ist ein Fehler aufgetreten.'
    },
    'fr': {
      checkingChanges: 'Vérification de {0}...',
      errorCheckingSite: 'Erreur lors de la vérification de {0}:',
      notificationTitle: 'Changement Détecté !',
      notificationMessage: 'Changement détecté sur {0}.',
      notificationErrorTitle: 'Erreur de Vérification de Site',
      notificationErrorMessage: 'Une erreur s\'est produite lors de la vérification de {0}.'
    },
    'es': {
      checkingChanges: 'Verificando {0}...',
      errorCheckingSite: 'Error al verificar {0}:',
      notificationTitle: '¡Cambio Detectado!',
      notificationMessage: 'Cambio detectado en {0}.',
      notificationErrorTitle: 'Error de Verificación de Sitio',
      notificationErrorMessage: 'Ocurrió un error al verificar {0}.'
    }
  };
  
  // Dil çevirilerine eriş
  const t = translations[language] || translations['en'];
  
  // String formatlama yardımcı fonksiyonu
  function formatString(str, ...args) {
    return str.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  }
  
  console.log(formatString(t.checkingChanges, site.url));
  
  fetch(site.url, {
    cache: 'no-store', // Cache'leme yapılmamasını sağlar
    headers: {
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
    .then(response => response.text())
    .then(html => {
      // HTML içeriğini basit string olarak işle
      let content;
      
      if (site.selector) {
        // Eğer seçici belirtilmişse, basit regex ile içeriği çıkarmaya çalış
        // Not: Bu mükemmel bir çözüm değildir, ama service worker'da çalışacaktır
        content = extractElementContent(html, site.selector);
      } else {
        // Tüm sayfa içeriğini al
        content = html;
      }
      
      // İçeriği hash'e dönüştür (veri boyutunu azaltmak için)
      const contentHash = hashString(content);
      
      // Site kaydını güncelle
      chrome.storage.sync.get(['trackedSites'], function(result) {
        const trackedSites = result.trackedSites || [];
        const siteIndex = trackedSites.findIndex(s => s.id === site.id);
        
        if (siteIndex !== -1) {
          const currentSite = trackedSites[siteIndex];
          
          // İlk kez kontrol ediliyorsa, sadece kaydet
          if (!currentSite.lastContentHash) {
            trackedSites[siteIndex].lastContentHash = contentHash;
            trackedSites[siteIndex].lastChecked = new Date().toISOString();
            
            chrome.storage.sync.set({trackedSites: trackedSites});
          } 
          // Değişiklik var mı kontrol et
          else if (contentHash !== currentSite.lastContentHash) {
            // Bildirim gönder
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'images/icon128.png',
              title: t.notificationTitle,
              message: formatString(t.notificationMessage, site.url),
              priority: 2
            });
            
            // Kaydı güncelle
            trackedSites[siteIndex].lastContentHash = contentHash;
            trackedSites[siteIndex].lastChecked = new Date().toISOString();
            
            chrome.storage.sync.set({trackedSites: trackedSites});
          } else {
            // Sadece son kontrol zamanını güncelle
            trackedSites[siteIndex].lastChecked = new Date().toISOString();
            chrome.storage.sync.set({trackedSites: trackedSites});
          }
        }
      });
    })
    .catch(error => {
      console.error(formatString(t.errorCheckingSite, site.url), error);
      
      // Hata bildirimi gönder
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: t.notificationErrorTitle,
        message: formatString(t.notificationErrorMessage, site.url),
        priority: 1
      });
    });
}



function MD5(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

// String hash fonksiyonu
function hashString(str) {
  var result = MD5(str);
  return result;
}

// Popup'tan gelen mesajları dinle
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Mesaj alındı:', request.action);
  
  // Ping mesajına yanıt ver
  if (request.action === 'ping') {
    console.log('Ping alındı, yanıt gönderiliyor');
    sendResponse({status: 'active', time: new Date().toISOString()});
    return true;
  }
  
  if (request.action === 'fetchContent') {
    const site = request.site;
    
    // Dil tercihini al
    chrome.storage.sync.get(['preferredLanguage'], function(result) {
      const language = result.preferredLanguage || 'tr';
      
      // Çeviri nesnesi
      const translations = {
        'tr': {
          initialContentSuccess: '{0} için ilk içerik başarıyla alındı.',
          initialContentError: '{0} sitesi kontrol edilirken bir hata oluştu.'
        },
        'en': {
          initialContentSuccess: 'Initial content for {0} successfully retrieved.',
          initialContentError: 'An error occurred while checking {0}.'
        },
        'de': {
          initialContentSuccess: 'Anfänglicher Inhalt für {0} erfolgreich abgerufen.',
          initialContentError: 'Beim Überprüfen von {0} ist ein Fehler aufgetreten.'
        },
        'fr': {
          initialContentSuccess: 'Contenu initial pour {0} récupéré avec succès.',
          initialContentError: 'Une erreur s\'est produite lors de la vérification de {0}.'
        },
        'es': {
          initialContentSuccess: 'Contenido inicial para {0} recuperado con éxito.',
          initialContentError: 'Ocurrió un error al verificar {0}.'
        }
      };
      
      // Dil çevirilerine eriş
      const t = translations[language] || translations['en'];
      
      // String formatlama yardımcı fonksiyonu
      function formatString(str, ...args) {
        return str.replace(/{(\d+)}/g, function(match, number) { 
          return typeof args[number] != 'undefined' ? args[number] : match;
        });
      }
      
      // İlk içeriği çek
      fetch(site.url)
        .then(response => response.text())
        .then(html => {
          // HTML içeriğini basit string olarak işle
          let content;
          
          if (site.selector) {
            // Eğer seçici belirtilmişse, regex ile içeriği çıkarmaya çalış
            content = extractElementContent(html, site.selector);
          } else {
            // Tüm sayfa içeriğini al
            content = html;
          }
          
          // İçeriği hash'e dönüştür
          const contentHash = hashString(content);
          
          // Site kaydını güncelle
          chrome.storage.sync.get(['trackedSites'], function(result) {
            const trackedSites = result.trackedSites || [];
            const siteIndex = trackedSites.findIndex(s => s.id === site.id);
            
            if (siteIndex !== -1) {
              trackedSites[siteIndex].lastContentHash = contentHash;
              trackedSites[siteIndex].lastChecked = new Date().toISOString();
              
              chrome.storage.sync.set({trackedSites: trackedSites}, function() {
                chrome.runtime.sendMessage({
                  action: 'updateStatus',
                  message: formatString(t.initialContentSuccess, site.url),
                  type: 'success'
                });
                
                // İşlem başarılı olduğunu bildir
                sendResponse({success: true});
              });
            }
          });
        })
        .catch(error => {
          console.error(`${site.url} kontrol edilirken hata:`, error);
          
          chrome.runtime.sendMessage({
            action: 'updateStatus',
            message: formatString(t.initialContentError, site.url),
            type: 'error'
          });
          
          // Hatayı bildir
          sendResponse({success: false, error: error.message});
        });
    });
    
    // Asenkron işlem olduğunu belirtmek için true döndür
    return true;
  }
});