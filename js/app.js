/**
 * 心情手札 Moodfolio - 主要應用程式邏輯
 * 負責頁面切換、事件處理和應用程式初始化
 */

class MoodfolioApp {
    constructor() {
        this.currentPage = 'today';
        this.selectedMood = null;
        this.currentDate = new Date();
        this.init();
    }

    /**
     * 初始化應用程式
     */
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.updateTodayDate();
        this.loadTodayMood();
        this.showPage('today');
        this.setupKeyboardShortcuts();
        this.initThemeSelector();
        
        // 顯示歡迎訊息
        if (!localStorage.getItem('moodfolio_initialized')) {
            this.showToast('歡迎使用心情手札！開始記錄你的每一天吧！', 'success');
            localStorage.setItem('moodfolio_initialized', 'true');
        }
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 導覽列事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                this.showPage(page);
            });
        });

        // 主題切換
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 今日心情頁面事件
        this.setupTodayPageEvents();
        
        // 設定頁面事件
        this.setupSettingsEvents();
    }

    /**
     * 設置今日心情頁面事件
     */
    setupTodayPageEvents() {
        // 心情選擇
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectMood(e.target.dataset.mood);
            });
        });

        // 儲存心情
        document.getElementById('saveMood').addEventListener('click', () => {
            this.saveMood();
        });

        // 清除心情
        document.getElementById('clearMood').addEventListener('click', () => {
            this.clearMood();
        });
    }

    /**
     * 設置設定頁面事件
     */
    setupSettingsEvents() {
        // 主題選擇
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        // 匯出資料
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // 匯入資料
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // 通知設定
        document.getElementById('enableNotification').addEventListener('change', (e) => {
            this.updateNotificationSettings(e.target.checked);
        });

        document.getElementById('notificationTime').addEventListener('change', (e) => {
            this.updateNotificationTime(e.target.value);
        });
    }

    /**
     * 設置鍵盤快捷鍵
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S 儲存
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (this.currentPage === 'today') {
                    this.saveMood();
                }
            }

            // N 新增/編輯今日心情
            if (e.key === 'n' && this.currentPage === 'today') {
                e.preventDefault();
                document.getElementById('moodNote').focus();
            }

            // Delete 刪除
            if (e.key === 'Delete') {
                if (this.currentPage === 'calendar' && document.getElementById('calendarDetail').style.display !== 'none') {
                    this.deleteMoodEntry();
                }
            }

            // 方向鍵切換月份
            if (this.currentPage === 'calendar') {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.previousYear();
                    } else {
                        this.previousMonth();
                    }
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.nextYear();
                    } else {
                        this.nextMonth();
                    }
                }
            }
        });
    }

    /**
     * 顯示指定頁面
     */
    showPage(pageName) {
        // 隱藏所有頁面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // 移除所有導覽項目的活動狀態
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // 顯示指定頁面
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
        }

        // 設置導覽項目活動狀態
        const navItem = document.querySelector(`[data-page="${pageName}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // 頁面特定的初始化
        this.initializePage(pageName);
    }

    /**
     * 初始化特定頁面
     */
    initializePage(pageName) {
        switch (pageName) {
            case 'today':
                this.loadTodayMood();
                break;
            case 'calendar':
                if (window.calendarManager) {
                    window.calendarManager.render();
                }
                break;
            case 'quotes':
                if (window.quotesManager) {
                    window.quotesManager.showRandomQuote();
                }
                break;
            case 'favorites':
                if (window.quotesManager) {
                    window.quotesManager.renderFavorites();
                }
                break;
            case 'fortune':
                if (window.fortuneManager) {
                    // 不要重置運勢，而是載入今日運勢
                    window.fortuneManager.loadTodayFortune();
                }
                break;
            case 'stats':
                if (window.statsManager) {
                    window.statsManager.render();
                }
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    /**
     * 更新今日日期顯示
     */
    updateTodayDate() {
        const today = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        const dateString = today.toLocaleDateString('zh-TW', options);
        document.getElementById('todayDate').textContent = dateString;
    }

    /**
     * 選擇心情
     */
    selectMood(mood) {
        // 移除之前選中的心情
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // 選中新心情
        const selectedBtn = document.querySelector(`[data-mood="${mood}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
            this.selectedMood = mood;
        }
    }

    /**
     * 載入今日心情
     */
    loadTodayMood() {
        const today = this.getTodayDateString();
        const entry = window.storageManager.getMoodEntry(today);
        
        if (entry) {
            this.selectMood(entry.mood);
            document.getElementById('moodNote').value = entry.note || '';
        } else {
            // 清除選擇和筆記
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            document.getElementById('moodNote').value = '';
            this.selectedMood = null;
        }
    }

    /**
     * 儲存心情
     */
    saveMood() {
        if (!this.selectedMood) {
            this.showToast('請先選擇一個心情！', 'warning');
            return;
        }

        const note = document.getElementById('moodNote').value.trim();
        const today = this.getTodayDateString();
        
        const entry = {
            date: today,
            mood: this.selectedMood,
            note: note,
            createdAt: Date.now()
        };

        window.storageManager.saveMoodEntry(entry);
        this.showToast('心情已儲存！', 'success');
        
        // 更新日曆顯示
        if (window.calendarManager) {
            window.calendarManager.render();
        }
    }

    /**
     * 取得今日日期字串（使用本地時間）
     */
    getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * 清除心情
     */
    clearMood() {
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('moodNote').value = '';
        this.selectedMood = null;
        this.showToast('已清除今日心情', 'success');
    }

    /**
     * 載入設定
     */
    loadSettings() {
        const settings = window.storageManager.getSettings();
        
        // 設置主題
        document.getElementById('themeSelect').value = settings.theme || 'auto';
        this.setTheme(settings.theme || 'auto');
        
        // 設置通知
        document.getElementById('enableNotification').checked = settings.notifications?.enabled || false;
        document.getElementById('notificationTime').value = settings.notifications?.time || '20:00';
    }

    /**
     * 設置主題
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        window.storageManager.saveSettings({ theme });
        
        // 更新主題切換按鈕圖示
        const themeToggle = document.getElementById('themeToggle');
        if (theme === 'dark' || theme === 'dark-warm' || theme === 'dark-cool') {
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
        
        // 更新主題選擇器
        this.updateThemeSelector(theme);
    }

    /**
     * 切換主題
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const themes = ['light', 'dark', 'warm-orange', 'fresh-green', 'romantic-pink', 'mystic-purple', 'ocean-blue', 'maple-red', 'dark-warm', 'dark-cool'];
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    /**
     * 更新主題選擇器
     */
    updateThemeSelector(activeTheme) {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-theme') === activeTheme) {
                option.classList.add('active');
            }
        });
    }

    /**
     * 初始化主題選擇器
     */
    initThemeSelector() {
        const themeSelector = document.querySelector('.theme-selector');
        if (!themeSelector) return;

        const themes = [
            { name: 'light', label: '淺色' },
            { name: 'dark', label: '深色' },
            { name: 'warm-orange', label: '溫暖橙' },
            { name: 'fresh-green', label: '清新綠' },
            { name: 'romantic-pink', label: '浪漫粉' },
            { name: 'mystic-purple', label: '神秘紫' },
            { name: 'ocean-blue', label: '海洋藍' },
            { name: 'maple-red', label: '楓葉紅' },
            { name: 'dark-warm', label: '暖深色' },
            { name: 'dark-cool', label: '冷深色' }
        ];

        themeSelector.innerHTML = '';
        themes.forEach(theme => {
            const option = document.createElement('div');
            option.className = 'theme-option';
            option.setAttribute('data-theme', theme.name);
            option.setAttribute('title', theme.label);
            option.addEventListener('click', () => this.setTheme(theme.name));
            themeSelector.appendChild(option);
        });

        // 設置當前主題
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        this.updateThemeSelector(currentTheme);
    }

    /**
     * 匯出資料
     */
    exportData() {
        const data = {
            moodEntries: window.storageManager.getAllMoodEntries(),
            fortuneEntries: window.storageManager.getAllFortuneEntries(),
            favoriteQuotes: window.storageManager.getFavoriteQuotes(),
            settings: window.storageManager.getSettings(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moodfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('資料匯出成功！', 'success');
    }

    /**
     * 匯入資料
     */
    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // 驗證資料格式
                if (!data.moodEntries || !data.favoriteQuotes || !data.settings) {
                    throw new Error('無效的資料格式');
                }
                
                // 為舊版本資料提供向後兼容
                if (!data.fortuneEntries) {
                    data.fortuneEntries = [];
                }

                // 顯示確認對話框
                this.showModal(
                    '匯入資料',
                    '確定要匯入資料嗎？這將會覆蓋現有的資料。',
                    [
                        { text: '取消', type: 'secondary' },
                        { text: '合併', type: 'primary', action: () => this.mergeData(data) },
                        { text: '覆蓋', type: 'danger', action: () => this.overwriteData(data) }
                    ]
                );
            } catch (error) {
                this.showToast('匯入失敗：無效的檔案格式', 'error');
            }
        };
        reader.readAsText(file);
    }

    /**
     * 合併資料
     */
    mergeData(data) {
        // 合併心情記錄（同日覆蓋）
        data.moodEntries.forEach(entry => {
            window.storageManager.saveMoodEntry(entry);
        });

        // 合併運勢記錄（同日覆蓋）
        if (data.fortuneEntries) {
            data.fortuneEntries.forEach(entry => {
                window.storageManager.saveFortuneEntry(entry);
            });
        }

        // 合併收藏（避免重複）
        const existingFavorites = window.storageManager.getFavoriteQuotes();
        const newFavorites = data.favoriteQuotes.filter(fav => 
            !existingFavorites.some(existing => existing.id === fav.id)
        );
        newFavorites.forEach(fav => {
            window.storageManager.addFavoriteQuote(fav);
        });

        // 更新設定（保留現有設定，只更新新的）
        const currentSettings = window.storageManager.getSettings();
        const mergedSettings = { ...currentSettings, ...data.settings };
        window.storageManager.saveSettings(mergedSettings);

        this.showToast('資料合併成功！', 'success');
        this.closeModal();
        
        // 重新載入頁面
        this.initializePage(this.currentPage);
    }

    /**
     * 覆蓋資料
     */
    overwriteData(data) {
        // 清除現有資料
        localStorage.removeItem('moodEntries');
        localStorage.removeItem('fortuneEntries');
        localStorage.removeItem('favoriteQuotes');
        localStorage.removeItem('settings');

        // 匯入新資料
        data.moodEntries.forEach(entry => {
            window.storageManager.saveMoodEntry(entry);
        });

        if (data.fortuneEntries) {
            data.fortuneEntries.forEach(entry => {
                window.storageManager.saveFortuneEntry(entry);
            });
        }

        data.favoriteQuotes.forEach(fav => {
            window.storageManager.addFavoriteQuote(fav);
        });

        window.storageManager.saveSettings(data.settings);

        this.showToast('資料覆蓋成功！', 'success');
        this.closeModal();
        
        // 重新載入頁面
        this.initializePage(this.currentPage);
    }

    /**
     * 更新通知設定
     */
    updateNotificationSettings(enabled) {
        const settings = window.storageManager.getSettings();
        if (!settings.notifications) settings.notifications = {};
        settings.notifications.enabled = enabled;
        window.storageManager.saveSettings(settings);

        if (enabled) {
            this.requestNotificationPermission();
        }
    }

    /**
     * 更新通知時間
     */
    updateNotificationTime(time) {
        const settings = window.storageManager.getSettings();
        if (!settings.notifications) settings.notifications = {};
        settings.notifications.time = time;
        window.storageManager.saveSettings(settings);
    }

    /**
     * 請求通知權限
     */
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.showToast('通知權限已啟用！', 'success');
            } else {
                this.showToast('通知權限被拒絕', 'warning');
            }
        }
    }

    /**
     * 顯示 Toast 通知
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        // 自動移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    /**
     * 顯示模態對話框
     */
    showModal(title, message, buttons = []) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');

        modalTitle.textContent = title;
        modalBody.textContent = message;

        // 清除現有按鈕
        modalFooter.innerHTML = '';

        // 添加按鈕
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn btn-${btn.type}`;
            button.textContent = btn.text;
            button.addEventListener('click', () => {
                if (btn.action) btn.action();
                this.closeModal();
            });
            modalFooter.appendChild(button);
        });

        modal.style.display = 'flex';
    }

    /**
     * 關閉模態對話框
     */
    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    /**
     * 刪除心情記錄
     */
    deleteMoodEntry() {
        const detailDate = document.getElementById('detailDate').textContent;
        const date = this.parseDateFromText(detailDate);
        
        if (date) {
            this.showModal(
                '確認刪除',
                `確定要刪除 ${date} 的心情記錄嗎？`,
                [
                    { text: '取消', type: 'secondary' },
                    { text: '刪除', type: 'danger', action: () => {
                        window.storageManager.deleteMoodEntry(date);
                        this.showToast('記錄已刪除', 'success');
                        document.getElementById('calendarDetail').style.display = 'none';
                        if (window.calendarManager) {
                            window.calendarManager.render();
                        }
                    }}
                ]
            );
        }
    }

    /**
     * 從文字解析日期
     */
    parseDateFromText(text) {
        // 假設格式為 "2024年1月15日"
        const match = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (match) {
            const year = match[1];
            const month = match[2].padStart(2, '0');
            const day = match[3].padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return null;
    }

    // 日曆控制方法（委託給 calendarManager）
    previousMonth() {
        if (window.calendarManager) {
            window.calendarManager.previousMonth();
        }
    }

    nextMonth() {
        if (window.calendarManager) {
            window.calendarManager.nextMonth();
        }
    }

    previousYear() {
        if (window.calendarManager) {
            window.calendarManager.previousYear();
        }
    }

    nextYear() {
        if (window.calendarManager) {
            window.calendarManager.nextYear();
        }
    }
}

// 全域變數
window.app = null;

// 當 DOM 載入完成後初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MoodfolioApp();
});
