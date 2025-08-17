/**
 * 心情手札 Moodfolio - PWA 管理
 * 負責 Progressive Web App 功能
 */

class PWAManager {
    constructor() {
        this.isInstalled = false;
        this.deferredPrompt = null;
        this.init();
    }

    /**
     * 初始化 PWA
     */
    init() {
        this.setupEventListeners();
        this.checkInstallation();
        this.registerServiceWorker();
        this.setupNotifications();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 安裝提示事件
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // 應用程式已安裝事件
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallPrompt();
            window.app.showToast('應用程式已安裝到桌面！', 'success');
        });

        // 離線/連線狀態變化
        window.addEventListener('online', () => {
            window.app.showToast('網路連線已恢復', 'success');
        });

        window.addEventListener('offline', () => {
            window.app.showToast('目前處於離線模式', 'warning');
        });
    }

    /**
     * 註冊 Service Worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker 註冊成功:', registration);
                
                // 檢查更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdatePrompt();
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker 註冊失敗:', error);
            }
        }
    }

    /**
     * 檢查安裝狀態
     */
    checkInstallation() {
        // 檢查是否為獨立視窗模式
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
        }
        
        // 檢查是否為 iOS 主畫面應用程式
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
        }
    }

    /**
     * 顯示安裝提示
     */
    showInstallPrompt() {
        if (this.isInstalled || !this.deferredPrompt) return;
        
        // 創建安裝提示元素
        const installPrompt = document.createElement('div');
        installPrompt.className = 'install-prompt';
        installPrompt.innerHTML = `
            <div class="install-content">
                <div class="install-icon">📱</div>
                <div class="install-text">
                    <h3>安裝心情手札</h3>
                    <p>將應用程式安裝到桌面，享受更好的使用體驗</p>
                </div>
                <div class="install-actions">
                    <button class="btn btn-primary" id="installApp">安裝</button>
                    <button class="btn btn-secondary" id="dismissInstall">稍後再說</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(installPrompt);
        
        // 添加事件監聽器
        document.getElementById('installApp').addEventListener('click', () => {
            this.installApp();
        });
        
        document.getElementById('dismissInstall').addEventListener('click', () => {
            this.hideInstallPrompt();
        });
        
        // 自動隱藏（5秒後）
        setTimeout(() => {
            this.hideInstallPrompt();
        }, 5000);
    }

    /**
     * 隱藏安裝提示
     */
    hideInstallPrompt() {
        const installPrompt = document.querySelector('.install-prompt');
        if (installPrompt) {
            installPrompt.remove();
        }
    }

    /**
     * 安裝應用程式
     */
    async installApp() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('使用者接受安裝');
        } else {
            console.log('使用者拒絕安裝');
        }
        
        this.deferredPrompt = null;
        this.hideInstallPrompt();
    }

    /**
     * 顯示更新提示
     */
    showUpdatePrompt() {
        const updatePrompt = document.createElement('div');
        updatePrompt.className = 'update-prompt';
        updatePrompt.innerHTML = `
            <div class="update-content">
                <div class="update-icon">🔄</div>
                <div class="update-text">
                    <h3>發現新版本</h3>
                    <p>有新版本可用，請重新載入頁面以更新</p>
                </div>
                <div class="update-actions">
                    <button class="btn btn-primary" id="reloadApp">重新載入</button>
                    <button class="btn btn-secondary" id="dismissUpdate">稍後</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(updatePrompt);
        
        document.getElementById('reloadApp').addEventListener('click', () => {
            window.location.reload();
        });
        
        document.getElementById('dismissUpdate').addEventListener('click', () => {
            updatePrompt.remove();
        });
    }

    /**
     * 設置通知
     */
    setupNotifications() {
        // 檢查通知權限
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                // 可以顯示通知權限請求
            } else if (Notification.permission === 'granted') {
                this.scheduleNotifications();
            }
        }
    }

    /**
     * 排程通知
     */
    scheduleNotifications() {
        const settings = window.storageManager.getSettings();
        
        if (settings.notifications?.enabled) {
            this.scheduleDailyNotification(settings.notifications.time);
        }
    }

    /**
     * 排程每日通知
     */
    scheduleDailyNotification(time) {
        if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
        
        // 解析時間
        const [hours, minutes] = time.split(':').map(Number);
        
        // 計算下次通知時間
        const now = new Date();
        const nextNotification = new Date();
        nextNotification.setHours(hours, minutes, 0, 0);
        
        // 如果今天的時間已過，設定為明天
        if (nextNotification <= now) {
            nextNotification.setDate(nextNotification.getDate() + 1);
        }
        
        const delay = nextNotification.getTime() - now.getTime();
        
        // 設定定時器
        setTimeout(() => {
            this.showDailyReminder();
            // 設定下一天的通知
            this.scheduleDailyNotification(time);
        }, delay);
    }

    /**
     * 顯示每日提醒
     */
    showDailyReminder() {
        if (Notification.permission === 'granted') {
            new Notification('心情手札提醒', {
                body: '記得記錄今天的心情哦！',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                tag: 'daily-reminder',
                requireInteraction: false
            });
        }
    }

    /**
     * 檢查網路狀態
     */
    checkNetworkStatus() {
        return navigator.onLine;
    }

    /**
     * 取得應用程式資訊
     */
    getAppInfo() {
        return {
            name: '心情手札 Moodfolio',
            version: '1.0.0',
            isInstalled: this.isInstalled,
            isOnline: navigator.onLine,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
    }

    /**
     * 分享應用程式
     */
    shareApp() {
        if (navigator.share) {
            navigator.share({
                title: '心情手札 Moodfolio',
                text: '記錄每日心情，查看心靈雞湯，抽今日運勢',
                url: window.location.href
            }).catch((error) => {
                console.log('分享失敗:', error);
            });
        } else {
            // 備用分享方法
            this.copyToClipboard(window.location.href);
            window.app.showToast('網址已複製到剪貼簿！', 'success');
        }
    }

    /**
     * 複製到剪貼簿
     */
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // 備用方法
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    /**
     * 取得儲存使用量
     */
    async getStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                percentage: (estimate.usage / estimate.quota) * 100
            };
        }
        return null;
    }

    /**
     * 清理快取
     */
    async clearCache() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
            window.app.showToast('快取已清理', 'success');
        }
    }

    /**
     * 取得離線狀態
     */
    isOffline() {
        return !navigator.onLine;
    }

    /**
     * 顯示離線提示
     */
    showOfflineMessage() {
        if (this.isOffline()) {
            window.app.showToast('目前處於離線模式，部分功能可能無法使用', 'warning');
        }
    }
}

// 建立全域 PWA 管理器實例
window.pwaManager = new PWAManager();
