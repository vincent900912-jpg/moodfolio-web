/**
 * 心情手札 Moodfolio - 儲存管理
 * 負責本地資料的存取和管理
 */

class StorageManager {
    constructor() {
        this.init();
    }

    /**
     * 初始化儲存管理器
     */
    init() {
        // 確保必要的儲存項目存在
        if (!localStorage.getItem('moodEntries')) {
            localStorage.setItem('moodEntries', JSON.stringify([]));
        }
        if (!localStorage.getItem('favoriteQuotes')) {
            localStorage.setItem('favoriteQuotes', JSON.stringify([]));
        }
        if (!localStorage.getItem('fortuneEntries')) {
            localStorage.setItem('fortuneEntries', JSON.stringify([]));
        }
        if (!localStorage.getItem('settings')) {
            localStorage.setItem('settings', JSON.stringify({
                theme: 'auto',
                notifications: {
                    enabled: false,
                    time: '20:00'
                }
            }));
        }
    }

    /**
     * 儲存心情記錄
     */
    saveMoodEntry(entry) {
        const entries = this.getAllMoodEntries();
        
        // 檢查是否已存在同一天的記錄
        const existingIndex = entries.findIndex(e => e.date === entry.date);
        
        if (existingIndex !== -1) {
            // 更新現有記錄
            entries[existingIndex] = entry;
        } else {
            // 新增記錄
            entries.push(entry);
        }
        
        localStorage.setItem('moodEntries', JSON.stringify(entries));
    }

    /**
     * 取得指定日期的心情記錄
     */
    getMoodEntry(date) {
        const entries = this.getAllMoodEntries();
        return entries.find(entry => entry.date === date);
    }

    /**
     * 取得所有心情記錄
     */
    getAllMoodEntries() {
        const entries = localStorage.getItem('moodEntries');
        return entries ? JSON.parse(entries) : [];
    }

    /**
     * 取得指定日期範圍的心情記錄
     */
    getMoodEntriesByRange(startDate, endDate) {
        const entries = this.getAllMoodEntries();
        return entries.filter(entry => {
            return entry.date >= startDate && entry.date <= endDate;
        });
    }

    /**
     * 刪除指定日期的心情記錄
     */
    deleteMoodEntry(date) {
        const entries = this.getAllMoodEntries();
        const filteredEntries = entries.filter(entry => entry.date !== date);
        localStorage.setItem('moodEntries', JSON.stringify(filteredEntries));
    }

    /**
     * 新增收藏語錄
     */
    addFavoriteQuote(quote) {
        const favorites = this.getFavoriteQuotes();
        
        // 檢查是否已存在
        const exists = favorites.some(fav => fav.id === quote.id);
        if (!exists) {
            favorites.push(quote);
            localStorage.setItem('favoriteQuotes', JSON.stringify(favorites));
        }
    }

    /**
     * 取得所有收藏語錄
     */
    getFavoriteQuotes() {
        const favorites = localStorage.getItem('favoriteQuotes');
        return favorites ? JSON.parse(favorites) : [];
    }

    /**
     * 刪除收藏語錄
     */
    deleteFavoriteQuote(id) {
        const favorites = this.getFavoriteQuotes();
        const filteredFavorites = favorites.filter(fav => fav.id !== id);
        localStorage.setItem('favoriteQuotes', JSON.stringify(filteredFavorites));
    }

    /**
     * 儲存運勢記錄
     */
    saveFortuneEntry(entry) {
        const entries = this.getAllFortuneEntries();
        
        // 檢查是否已存在同一天的記錄
        const existingIndex = entries.findIndex(e => e.date === entry.date);
        
        if (existingIndex !== -1) {
            // 更新現有記錄
            entries[existingIndex] = entry;
        } else {
            // 新增記錄
            entries.push(entry);
        }
        
        localStorage.setItem('fortuneEntries', JSON.stringify(entries));
    }

    /**
     * 取得指定日期的運勢記錄
     */
    getFortuneEntry(date) {
        const entries = this.getAllFortuneEntries();
        return entries.find(entry => entry.date === date);
    }

    /**
     * 取得所有運勢記錄
     */
    getAllFortuneEntries() {
        const entries = localStorage.getItem('fortuneEntries');
        return entries ? JSON.parse(entries) : [];
    }

    /**
     * 刪除指定日期的運勢記錄
     */
    deleteFortuneEntry(date) {
        const entries = this.getAllFortuneEntries();
        const filteredEntries = entries.filter(entry => entry.date !== date);
        localStorage.setItem('fortuneEntries', JSON.stringify(filteredEntries));
    }

    /**
     * 儲存設定
     */
    saveSettings(settings) {
        const currentSettings = this.getSettings();
        const mergedSettings = { ...currentSettings, ...settings };
        localStorage.setItem('settings', JSON.stringify(mergedSettings));
    }

    /**
     * 取得設定
     */
    getSettings() {
        const settings = localStorage.getItem('settings');
        return settings ? JSON.parse(settings) : {
            theme: 'auto',
            notifications: {
                enabled: false,
                time: '20:00'
            }
        };
    }

    /**
     * 取得本月心情統計
     */
    getMonthlyStats(year, month) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
        
        const entries = this.getMoodEntriesByRange(startDate, endDate);
        
        // 統計各心情數量
        const moodCounts = {};
        entries.forEach(entry => {
            moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        });
        
        return {
            total: entries.length,
            moodCounts: moodCounts,
            entries: entries
        };
    }

    /**
     * 取得連續記錄天數
     */
    getStreakDays(year, month) {
        const stats = this.getMonthlyStats(year, month);
        const entries = stats.entries;
        
        if (entries.length === 0) return 0;
        
        // 按日期排序
        entries.sort((a, b) => a.date.localeCompare(b.date));
        
        let maxStreak = 0;
        let currentStreak = 0;
        let lastDate = null;
        
        entries.forEach(entry => {
            const currentDate = new Date(entry.date);
            
            if (lastDate === null) {
                currentStreak = 1;
            } else {
                const diffTime = currentDate - lastDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            }
            
            maxStreak = Math.max(maxStreak, currentStreak);
            lastDate = currentDate;
        });
        
        return maxStreak;
    }

    /**
     * 清除所有資料
     */
    clearAllData() {
        localStorage.removeItem('moodEntries');
        localStorage.removeItem('favoriteQuotes');
        localStorage.removeItem('settings');
        this.init();
    }

    /**
     * 取得儲存統計
     */
    getStorageStats() {
        const entries = this.getAllMoodEntries();
        const favorites = this.getFavoriteQuotes();
        
        return {
            totalEntries: entries.length,
            totalFavorites: favorites.length,
            storageSize: this.getStorageSize()
        };
    }

    /**
     * 取得儲存大小
     */
    getStorageSize() {
        let totalSize = 0;
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        
        return totalSize;
    }

    /**
     * 備份資料
     */
    backupData() {
        return {
            moodEntries: this.getAllMoodEntries(),
            favoriteQuotes: this.getFavoriteQuotes(),
            settings: this.getSettings(),
            backupDate: new Date().toISOString()
        };
    }

    /**
     * 還原資料
     */
    restoreData(data) {
        if (data.moodEntries) {
            localStorage.setItem('moodEntries', JSON.stringify(data.moodEntries));
        }
        if (data.favoriteQuotes) {
            localStorage.setItem('favoriteQuotes', JSON.stringify(data.favoriteQuotes));
        }
        if (data.settings) {
            localStorage.setItem('settings', JSON.stringify(data.settings));
        }
    }

    /**
     * 檢查儲存空間
     */
    checkStorageSpace() {
        const stats = this.getStorageStats();
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        return {
            used: stats.storageSize,
            max: maxSize,
            percentage: (stats.storageSize / maxSize) * 100,
            isFull: stats.storageSize > maxSize * 0.9
        };
    }

    /**
     * 清理舊資料
     */
    cleanupOldData(daysToKeep = 365) {
        const entries = this.getAllMoodEntries();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        const filteredEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= cutoffDate;
        });
        
        localStorage.setItem('moodEntries', JSON.stringify(filteredEntries));
        
        return {
            removed: entries.length - filteredEntries.length,
            remaining: filteredEntries.length
        };
    }
}

// 建立全域儲存管理器實例
window.storageManager = new StorageManager();
