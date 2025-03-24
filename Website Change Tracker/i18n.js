// Dil kaynaklarının yüklenmesi ve işlenmesi
(function() {
    // Aktif dil
    let currentLanguage = 'tr';
  
    // Tüm dil kaynaklarını içeren nesne
    const translations = {
      'tr': {
        appTitle: 'Site Değişiklik Takipçisi',
        urlLabel: 'Takip Edilecek Site URL:',
        selectorLabel: 'CSS Seçici (opsiyonel):',
        selectorHelp: 'Boş bırakılırsa tüm sayfa kontrol edilir',
        intervalLabel: 'Kontrol Aralığı (dakika):',
        saveButton: 'Kaydet ve Takibe Başla',
        stopButton: 'Takibi Durdur',
        trackedSitesTitle: 'Takip Edilen Siteler',
        noSitesTracked: 'Takip edilen site bulunmuyor',
        urlRequired: 'Lütfen geçerli bir URL girin',
        urlInvalid: 'Geçerli bir URL girin (http:// veya https:// ile başlamalı)',
        intervalWarning: 'Kontrol aralığı en az 5 dakika olmalıdır',
        siteAdded: '"{0}" takip listesine eklendi! Her {1} dakikada bir kontrol edilecek.',
        siteExists: 'Bu URL zaten takip ediliyor!',
        allTrackingStopped: 'Tüm takipler durduruldu',
        noTrackingToStop: 'Takip edilen site bulunmuyor',
        initialContentSuccess: '{0} için ilk içerik başarıyla alındı.',
        initialContentError: '{0} sitesi kontrol edilirken bir hata oluştu.',
        siteRemoved: 'Site takip listesinden kaldırıldı',
        checkingChanges: '{0} kontrol ediliyor...',
        errorCheckingSite: '{0} kontrol edilirken hata oluştu:',
        notificationTitle: 'Değişiklik Tespit Edildi!',
        notificationMessage: '{0} sitesinde değişiklik tespit edildi.',
        notificationErrorTitle: 'Site Kontrol Hatası',
        notificationErrorMessage: '{0} sitesi kontrol edilirken bir hata oluştu.',
        removeButton: 'Kaldır'
      },
      'en': {
        appTitle: 'Website Change Tracker',
        urlLabel: 'Website URL to Track:',
        selectorLabel: 'CSS Selector (optional):',
        selectorHelp: 'If left empty, entire page will be checked',
        intervalLabel: 'Check Interval (minutes):',
        saveButton: 'Save and Start Tracking',
        stopButton: 'Stop Tracking',
        trackedSitesTitle: 'Tracked Websites',
        noSitesTracked: 'No websites are being tracked',
        urlRequired: 'Please enter a valid URL',
        urlInvalid: 'Enter a valid URL (must start with http:// or https://)',
        intervalWarning: 'Check interval must be at least 5 minutes',
        siteAdded: '"{0}" added to tracking list! Will be checked every {1} minutes.',
        siteExists: 'This URL is already being tracked!',
        allTrackingStopped: 'All tracking has been stopped',
        noTrackingToStop: 'No websites are being tracked',
        initialContentSuccess: 'Initial content for {0} successfully retrieved.',
        initialContentError: 'An error occurred while checking {0}.',
        siteRemoved: 'Website removed from tracking list',
        checkingChanges: 'Checking {0}...',
        errorCheckingSite: 'Error checking {0}:',
        notificationTitle: 'Change Detected!',
        notificationMessage: 'Change detected on {0}.',
        notificationErrorTitle: 'Website Check Error',
        notificationErrorMessage: 'An error occurred while checking {0}.',
        removeButton: 'Remove'
      },
      'de': {
        appTitle: 'Webseiten-Änderungstracker',
        urlLabel: 'Zu überwachende Webseiten-URL:',
        selectorLabel: 'CSS-Selektor (optional):',
        selectorHelp: 'Wenn leer, wird die gesamte Seite überprüft',
        intervalLabel: 'Prüfintervall (Minuten):',
        saveButton: 'Speichern und Überwachung starten',
        stopButton: 'Überwachung stoppen',
        trackedSitesTitle: 'Überwachte Webseiten',
        noSitesTracked: 'Keine Webseiten werden überwacht',
        urlRequired: 'Bitte geben Sie eine gültige URL ein',
        urlInvalid: 'Geben Sie eine gültige URL ein (muss mit http:// oder https:// beginnen)',
        intervalWarning: 'Das Prüfintervall muss mindestens 5 Minuten betragen',
        siteAdded: '"{0}" zur Überwachungsliste hinzugefügt! Wird alle {1} Minuten überprüft.',
        siteExists: 'Diese URL wird bereits überwacht!',
        allTrackingStopped: 'Alle Überwachungen wurden gestoppt',
        noTrackingToStop: 'Keine Webseiten werden überwacht',
        initialContentSuccess: 'Anfänglicher Inhalt für {0} erfolgreich abgerufen.',
        initialContentError: 'Beim Überprüfen von {0} ist ein Fehler aufgetreten.',
        siteRemoved: 'Webseite aus der Überwachungsliste entfernt',
        checkingChanges: 'Überprüfe {0}...',
        errorCheckingSite: 'Fehler beim Überprüfen von {0}:',
        notificationTitle: 'Änderung erkannt!',
        notificationMessage: 'Änderung auf {0} erkannt.',
        notificationErrorTitle: 'Fehler bei Webseiten-Überprüfung',
        notificationErrorMessage: 'Beim Überprüfen von {0} ist ein Fehler aufgetreten.',
        removeButton: 'Entfernen'
      },
      'fr': {
        appTitle: 'Suivi des Changements de Sites Web',
        urlLabel: 'URL du site à suivre:',
        selectorLabel: 'Sélecteur CSS (optionnel):',
        selectorHelp: 'Si vide, la page entière sera vérifiée',
        intervalLabel: 'Intervalle de vérification (minutes):',
        saveButton: 'Enregistrer et Commencer le Suivi',
        stopButton: 'Arrêter le Suivi',
        trackedSitesTitle: 'Sites Web Suivis',
        noSitesTracked: 'Aucun site web n\'est suivi',
        urlRequired: 'Veuillez entrer une URL valide',
        urlInvalid: 'Entrez une URL valide (doit commencer par http:// ou https://)',
        intervalWarning: 'L\'intervalle de vérification doit être d\'au moins 5 minutes',
        siteAdded: '"{0}" ajouté à la liste de suivi ! Sera vérifié toutes les {1} minutes.',
        siteExists: 'Cette URL est déjà suivie !',
        allTrackingStopped: 'Tous les suivis ont été arrêtés',
        noTrackingToStop: 'Aucun site web n\'est suivi',
        initialContentSuccess: 'Contenu initial pour {0} récupéré avec succès.',
        initialContentError: 'Une erreur s\'est produite lors de la vérification de {0}.',
        siteRemoved: 'Site web retiré de la liste de suivi',
        checkingChanges: 'Vérification de {0}...',
        errorCheckingSite: 'Erreur lors de la vérification de {0}:',
        notificationTitle: 'Changement Détecté !',
        notificationMessage: 'Changement détecté sur {0}.',
        notificationErrorTitle: 'Erreur de Vérification de Site',
        notificationErrorMessage: 'Une erreur s\'est produite lors de la vérification de {0}.',
        removeButton: 'Retirer'
      },
      'es': {
        appTitle: 'Rastreador de Cambios en Sitios Web',
        urlLabel: 'URL del sitio a rastrear:',
        selectorLabel: 'Selector CSS (opcional):',
        selectorHelp: 'Si se deja vacío, se verificará toda la página',
        intervalLabel: 'Intervalo de verificación (minutos):',
        saveButton: 'Guardar y Comenzar Rastreo',
        stopButton: 'Detener Rastreo',
        trackedSitesTitle: 'Sitios Web Rastreados',
        noSitesTracked: 'No hay sitios web siendo rastreados',
        urlRequired: 'Por favor ingrese una URL válida',
        urlInvalid: 'Ingrese una URL válida (debe comenzar con http:// o https://)',
        intervalWarning: 'El intervalo de verificación debe ser de al menos 5 minutos',
        siteAdded: '¡"{0}" añadido a la lista de rastreo! Se verificará cada {1} minutos.',
        siteExists: '¡Esta URL ya está siendo rastreada!',
        allTrackingStopped: 'Se ha detenido todo el rastreo',
        noTrackingToStop: 'No hay sitios web siendo rastreados',
        initialContentSuccess: 'Contenido inicial para {0} recuperado con éxito.',
        initialContentError: 'Ocurrió un error al verificar {0}.',
        siteRemoved: 'Sitio web eliminado de la lista de rastreo',
        checkingChanges: 'Verificando {0}...',
        errorCheckingSite: 'Error al verificar {0}:',
        notificationTitle: '¡Cambio Detectado!',
        notificationMessage: 'Cambio detectado en {0}.',
        notificationErrorTitle: 'Error de Verificación de Sitio',
        notificationErrorMessage: 'Ocurrió un error al verificar {0}.',
        removeButton: 'Eliminar'
      }
    };
  
    // String formatlama yardımcı fonksiyonu
    function formatString(str, ...args) {
      return str.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
      });
    }
  
    // Dil değiştirme fonksiyonu
    function changeLanguage(lang) {
      if (!translations[lang]) {
        console.error('Desteklenmeyen dil:', lang);
        return;
      }
  
      currentLanguage = lang;
      
      // Sayfadaki tüm dil öğelerini güncelle
      document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
          element.textContent = translations[lang][key];
        }
      });
  
      // Kullanıcı tercihini kaydet
      chrome.storage.sync.set({preferredLanguage: lang});
    }
  
    // Dil değiştirme olayını dinle
    document.addEventListener('DOMContentLoaded', () => {
      const languageSelect = document.getElementById('languageSelect');
      
      if (languageSelect) {
        // Kayıtlı dil tercihini kontrol et
        chrome.storage.sync.get(['preferredLanguage'], function(result) {
          if (result.preferredLanguage) {
            languageSelect.value = result.preferredLanguage;
            changeLanguage(result.preferredLanguage);
          }
        });
        
        // Dil değişikliğini dinle
        languageSelect.addEventListener('change', function() {
          changeLanguage(this.value);
        });
      }
    });
  
    // Dışa aktarılan fonksiyonlar
    window.i18n = {
      translate: function(key, ...args) {
        if (!translations[currentLanguage] || !translations[currentLanguage][key]) {
          return key;
        }
        return formatString(translations[currentLanguage][key], ...args);
      },
      getCurrentLanguage: function() {
        return currentLanguage;
      }
    };
  })();