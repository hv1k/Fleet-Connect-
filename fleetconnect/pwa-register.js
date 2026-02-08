// pwa-register.js - PWA registration utility for all FleetConnect pages
// Handles service worker registration, install prompts, and update checks

(function() {
  'use strict';

  const PWARegister = {
    deferredPrompt: null,
    installBannerShown: false,

    // Initialize PWA features
    init() {
      console.log('[PWA] Initializing PWA registration...');

      // Register service worker
      if ('serviceWorker' in navigator) {
        this.registerServiceWorker();
      }

      // Listen for install prompt
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('[PWA] Install prompt available');
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallBanner();
      });

      // App installed event
      window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed');
        this.hideInstallBanner();
        this.deferredPrompt = null;
      });

      // Check for updates periodically
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        setInterval(() => this.checkForUpdates(), 60000); // Check every minute
      }

      // Request notification permission
      this.requestNotificationPermission();
    },

    // Register service worker
    registerServiceWorker() {
      navigator.serviceWorker.register('/pwa-sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully');

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker update available');
                this.showUpdateNotification();
              }
            });
          });

          // Periodically check for updates
          setInterval(() => registration.update(), 60000);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    },

    // Check for updates
    checkForUpdates() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.update();
          });
        });
      }
    },

    // Show install banner (top of page)
    showInstallBanner() {
      if (this.installBannerShown || !this.deferredPrompt) return;

      const banner = document.createElement('div');
      banner.id = 'pwa-install-banner';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); color: white; font-size: 14px; font-weight: 500; border-radius: 8px; margin: 12px; box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);">
          <svg style="width: 20px; height: 20px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>Install FleetConnect for the best experience - works offline!</span>
          <button id="pwa-install-btn" style="margin-left: auto; padding: 6px 14px; background: white; color: #60a5fa; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all 0.2s;">Install</button>
          <button id="pwa-dismiss-btn" style="padding: 4px 8px; background: rgba(255, 255, 255, 0.2); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; transition: all 0.2s;" title="Dismiss">✕</button>
        </div>
      `;

      document.body.insertBefore(banner, document.body.firstChild);
      this.installBannerShown = true;

      document.getElementById('pwa-install-btn').addEventListener('click', () => this.promptInstall());
      document.getElementById('pwa-dismiss-btn').addEventListener('click', () => this.hideBanner(banner));
    },

    // Hide install banner
    hideInstallBanner() {
      const banner = document.getElementById('pwa-install-banner');
      if (banner) {
        this.hideBanner(banner);
      }
    },

    // Hide banner with fade animation
    hideBanner(banner) {
      banner.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        if (banner.parentElement) {
          banner.parentElement.removeChild(banner);
        }
      }, 300);
    },

    // Trigger install prompt
    promptInstall() {
      if (!this.deferredPrompt) return;

      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted install prompt');
        } else {
          console.log('[PWA] User dismissed install prompt');
        }
        this.deferredPrompt = null;
        this.hideInstallBanner();
      });
    },

    // Show update available notification
    showUpdateNotification() {
      const notification = document.createElement('div');
      notification.id = 'pwa-update-notification';
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #1e293b; border: 1px solid #3b82f6; color: #60a5fa; font-size: 14px; font-weight: 500; border-radius: 8px; margin: 12px; box-shadow: 0 4px 12px rgba(96, 165, 250, 0.2);">
          <svg style="width: 18px; height: 18px; flex-shrink: 0; animation: spin 1s linear infinite;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <span>Update available! Refresh to get the latest version.</span>
          <button id="pwa-refresh-btn" style="margin-left: auto; padding: 6px 14px; background: #60a5fa; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all 0.2s;">Refresh</button>
          <button id="pwa-update-dismiss" style="padding: 4px 8px; background: transparent; color: #60a5fa; border: 1px solid #60a5fa; border-radius: 4px; cursor: pointer; font-size: 14px; transition: all 0.2s;">Later</button>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;

      document.body.insertBefore(notification, document.body.firstChild);

      document.getElementById('pwa-refresh-btn').addEventListener('click', () => {
        window.location.reload();
      });

      document.getElementById('pwa-update-dismiss').addEventListener('click', () => {
        const notif = document.getElementById('pwa-update-notification');
        if (notif) {
          notif.style.animation = 'fadeOut 0.3s ease-out forwards';
          setTimeout(() => notif.parentElement?.removeChild(notif), 300);
        }
      });
    },

    // Request notification permission
    requestNotificationPermission() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          console.log('[PWA] Notification permission:', permission);
          if (permission === 'granted') {
            this.enablePushNotifications();
          }
        });
      }
    },

    // Enable push notifications
    enablePushNotifications() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.pushManager.getSubscription().then((subscription) => {
            if (!subscription) {
              console.log('[PWA] No push subscription found, subscribing...');
              // In production, subscribe to push manager here
            }
          });
        });
      }
    }
  };

  // Add CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-10px); }
    }
    #pwa-install-btn:hover {
      background: #f0f0f5;
      transform: scale(1.02);
    }
    #pwa-refresh-btn:hover {
      background: #3b82f6;
      transform: scale(1.02);
    }
    #pwa-update-dismiss:hover {
      background: #60a5fa;
      color: white;
    }
  `;
  document.head.appendChild(style);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PWARegister.init());
  } else {
    PWARegister.init();
  }

  // Export globally
  window.PWARegister = PWARegister;
})();
