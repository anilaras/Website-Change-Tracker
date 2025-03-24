// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const selectorInput = document.getElementById('selectorInput');
    const intervalInput = document.getElementById('intervalInput');
    const saveButton = document.getElementById('saveButton');
    const stopButton = document.getElementById('stopButton');
    const statusDiv = document.getElementById('status');
    const siteList = document.getElementById('siteList');
    
    // Service worker'ı başlatmaya çalış
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
      console.log('Background page bağlantısı deneniyor...');
      // Bu fonksiyon sadece background page modunda işe yarar, service worker'da çalışmaz
      // Ama hata fırlatırsa hata yakalarız
      if (chrome.runtime.lastError) {
        console.warn('Background page bulunamadı (service worker kullanılıyor):', chrome.runtime.lastError);
      }
    });
    
    // Site listesini yükle
    loadSiteList();
    
    // Kaydet butonu tıklandığında
    saveButton.addEventListener('click', function() {
      const url = urlInput.value.trim();
      if (!url || !url.startsWith('http')) {
        showStatus(window.i18n.translate('urlInvalid'), 'error');
        return;
      }
      
      // URL'yi doğrula
      try {
        new URL(url);
      } catch (e) {
        showStatus(window.i18n.translate('urlInvalid'), 'error');
        return;
      }
      
      const selector = selectorInput.value.trim();
      const interval = parseInt(intervalInput.value, 10) || 30;
      
      if (interval < 1) {
        showStatus(window.i18n.translate('intervalWarning'), 'error');
        return;
      }
      
      // Siteyi ekle ve takibe başla
      addSite(url, selector, interval);
    });
    
    // Durdur butonu tıklandığında
    stopButton.addEventListener('click', function() {
      chrome.storage.sync.get(['trackedSites'], function(result) {
        const trackedSites = result.trackedSites || [];
        
        if (trackedSites.length === 0) {
          showStatus(window.i18n.translate('noTrackingToStop'), 'error');
          return;
        }
        
        // Tüm alarmları temizle
        trackedSites.forEach(site => {
          chrome.alarms.clear(site.id);
        });
        
        // Tracked sites listesini temizle
        chrome.storage.sync.set({trackedSites: []}, function() {
          showStatus(window.i18n.translate('allTrackingStopped'), 'success');
          loadSiteList(); // Listeyi güncelle
        });
      });
    });
    
    function addSite(url, selector, interval) {
      chrome.storage.sync.get(['trackedSites'], function(result) {
        const trackedSites = result.trackedSites || [];
        
        // URL zaten takip ediliyor mu kontrol et
        const existingSite = trackedSites.find(site => site.url === url);
        if (existingSite) {
          showStatus(window.i18n.translate('siteExists'), 'error');
          return;
        }
        
        // Yeni site ekle
        const siteId = 'site_' + Date.now();
        const newSite = {
          id: siteId,
          url: url,
          selector: selector,
          interval: interval,
          lastContentHash: '', // Hash kullanıyoruz, içerik değil
          lastChecked: null
        };
        
        trackedSites.push(newSite);
        
        // Storage'a kaydet
        chrome.storage.sync.set({trackedSites: trackedSites}, function() {
          // İlk içeriği al ve kaydet - doğrudan storage kaydı ile yönetim
          directFetchAndStore(newSite);
          
          // Alarm kur
          chrome.alarms.create(siteId, {
            delayInMinutes: interval,
            periodInMinutes: interval
          });
          
          showStatus(window.i18n.translate('siteAdded', url, interval), 'success');
          loadSiteList(); // Listeyi güncelle
          
          // Form alanlarını temizle
          urlInput.value = '';
          selectorInput.value = '';
          intervalInput.value = '30';
        });
      });
    }
    
    // Doğrudan içerik alımı ve saklama - background script'e ihtiyaç duymadan
    function directFetchAndStore(site) {
      fetch(site.url, {
        cache: 'no-store', // Cache'leme yapılmamasını sağlar
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
        .then(response => response.text())
        .then(html => {
          // İçeriği işle
          let content;
          if (site.selector) {
            const regex = new RegExp(`<([^>]*?${site.selector}[^>]*?)>(.*?)<\/`, 'gs');
            const match = regex.exec(html);
            content = match ? match[2].trim() : html;
          } else {
            content = html;
          }
          
          // İçerik hash'i hesapla
          const contentHash = hashString(content);
          
          // Storage'a kaydet
          chrome.storage.sync.get(['trackedSites'], function(result) {
            const trackedSites = result.trackedSites || [];
            const siteIndex = trackedSites.findIndex(s => s.id === site.id);
            
            if (siteIndex !== -1) {
              trackedSites[siteIndex].lastContentHash = contentHash;
              trackedSites[siteIndex].lastChecked = new Date().toISOString();
              
              chrome.storage.sync.set({trackedSites: trackedSites}, function() {
                showStatus(`${site.url} için ilk içerik başarıyla alındı.`, 'success');
              });
            }
          });
        })
        .catch(error => {
          console.error(`${site.url} kontrol edilirken hata:`, error);
          showStatus(`${site.url} sitesi kontrol edilirken bir hata oluştu.`, 'error');
        });
    }
    
    // String hash fonksiyonu
    function hashString(str) {
      let hash = 0;
      if (str.length === 0) return hash.toString();
      
      for (let i = 0; i < Math.min(str.length, 10000); i++) { // Fazla büyük içerikler için limit
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return hash.toString();
    }
    
    // Alternatif, message-based içerik alımı - hala bir seçenek olarak tutuluyor
    function fetchAndStoreContent(site) {
      try {
        // Doğrudan background.js'i çalıştırmaya çalış
        chrome.runtime.getBackgroundPage(function(backgroundPage) {
          if (chrome.runtime.lastError) {
            console.warn('Background page erişilemedi, doğrudan fetch kullanılıyor');
            directFetchAndStore(site);
            return;
          }
          
          // Background script'e mesaj göndermeyi dene
          chrome.runtime.sendMessage({
            action: 'fetchContent',
            site: site
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.warn('Mesaj gönderilemedi, doğrudan fetch kullanılıyor:', chrome.runtime.lastError);
              directFetchAndStore(site);
            }
          });
        });
      } catch (error) {
        console.error('İletişim hatası, doğrudan fetch kullanılıyor:', error);
        directFetchAndStore(site);
      }
    }
    
    function loadSiteList() {
      chrome.storage.sync.get(['trackedSites'], function(result) {
        const trackedSites = result.trackedSites || [];
        siteList.innerHTML = '';
        
        if (trackedSites.length === 0) {
          siteList.innerHTML = '<li>' + window.i18n.translate('noSitesTracked') + '</li>';
          return;
        }
        
        trackedSites.forEach(site => {
          const li = document.createElement('li');
          
          const siteInfo = document.createElement('div');
          siteInfo.innerHTML = `
            <strong>${site.url}</strong><br>
            <small>${window.i18n.translate('intervalLabel').replace(':', '')}: ${site.interval} ${window.i18n.translate('intervalLabel').includes('dakika') ? 'dk.' : 'min.'} | 
            ${window.i18n.translate('selectorLabel').replace(':', '')}: ${site.selector || window.i18n.translate('selectorHelp')}</small>
          `;
          
          const removeButton = document.createElement('button');
          removeButton.textContent = window.i18n.translate('removeButton');
          removeButton.addEventListener('click', function() {
            removeSite(site.id);
          });
          
          li.appendChild(siteInfo);
          li.appendChild(removeButton);
          siteList.appendChild(li);
        });
      });
    }
    
    function removeSite(siteId) {
      chrome.storage.sync.get(['trackedSites'], function(result) {
        const trackedSites = result.trackedSites || [];
        const updatedSites = trackedSites.filter(site => site.id !== siteId);
        
        // Alarmı iptal et
        chrome.alarms.clear(siteId);
        
        // Listeyi güncelle
        chrome.storage.sync.set({trackedSites: updatedSites}, function() {
          showStatus(window.i18n.translate('siteRemoved'), 'success');
          loadSiteList();
        });
      });
    }
    
    function showStatus(message, type) {
      statusDiv.textContent = message;
      statusDiv.className = 'status ' + type;
      
      // 5 saniye sonra mesajı kaldır
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
      }, 5000);
    }
    
    // Mesaj dinleyici
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === 'updateStatus') {
        showStatus(request.message, request.type);
        loadSiteList();
      }
      
      // Ping mesajlarına yanıt ver
      if (request.action === 'ping') {
        sendResponse({status: 'active'});
      }
      
      return true; // Asenkron yanıt için
    });
});