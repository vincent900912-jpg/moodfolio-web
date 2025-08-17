/**
 * 心情手札 Moodfolio - 運勢管理
 * 負責運勢抽取和顯示功能
 */

class FortuneManager {
    constructor() {
        this.currentFortune = null;
        this.setupEventListeners();
        this.loadTodayFortune();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 抽籤按鈕
        document.getElementById('drawFortune').addEventListener('click', () => {
            this.drawFortune();
        });

        // 逆天改命按鈕
        document.getElementById('redrawFortune').addEventListener('click', () => {
            this.redrawFortune();
        });
    }

    /**
     * 載入今日運勢（如果已存在）
     */
    loadTodayFortune() {
        const today = this.getTodayDateString();
        const fortuneEntry = window.storageManager.getFortuneEntry(today);
        
        if (fortuneEntry) {
            this.currentFortune = fortuneEntry;
            this.displayFortune();
            console.log('已載入今日運勢:', fortuneEntry.level);
        } else {
            // 如果沒有今日運勢，重置顯示但不清除 currentFortune
            if (!this.currentFortune) {
                this.resetDisplay();
            }
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
     * 重置顯示但保留運勢資料
     */
    resetDisplay() {
        document.getElementById('fortuneLevel').textContent = '點擊抽籤開始';
        document.getElementById('fortuneLevel').style.color = '';
        document.getElementById('fortuneDetails').style.display = 'none';
        document.getElementById('redrawFortune').style.display = 'none';
        document.getElementById('drawFortune').style.display = 'inline-flex';
    }

    /**
     * 抽取運勢
     */
    drawFortune() {
        // 根據權重隨機選擇運勢等級
        const fortuneLevel = this.getRandomFortuneLevel();
        
        // 隨機選擇解籤文字
        const interpretations = window.FORTUNE_INTERPRETATIONS[fortuneLevel.level];
        const interpretation = interpretations[Math.floor(Math.random() * interpretations.length)];
        
        // 隨機選擇幸運色
        const luckyColor = window.LUCKY_COLORS[Math.floor(Math.random() * window.LUCKY_COLORS.length)];
        
        // 隨機生成幸運數字 (1-99)
        const luckyNumber = Math.floor(Math.random() * 99) + 1;
        
        // 隨機選擇幸運物品
        const luckyItem = window.LUCKY_ITEMS[Math.floor(Math.random() * window.LUCKY_ITEMS.length)];
        
        // 隨機選擇幸運方向
        const luckyDirection = window.LUCKY_DIRECTIONS[Math.floor(Math.random() * window.LUCKY_DIRECTIONS.length)];
        
        this.currentFortune = {
            level: fortuneLevel.level,
            color: fortuneLevel.color,
            interpretation: interpretation,
            luckyColor: luckyColor,
            luckyNumber: luckyNumber,
            luckyItem: luckyItem,
            luckyDirection: luckyDirection,
            drawnAt: new Date().toISOString()
        };
        
        // 儲存到日曆
        this.saveFortuneToCalendar();
        
        this.displayFortune();
    }

    /**
     * 根據權重隨機選擇運勢等級
     */
    getRandomFortuneLevel() {
        const levels = window.FORTUNE_LEVELS;
        const totalWeight = levels.reduce((sum, level) => sum + level.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const level of levels) {
            random -= level.weight;
            if (random <= 0) {
                return level;
            }
        }
        
        return levels[levels.length - 1]; // 預設返回最後一個
    }

    /**
     * 顯示運勢
     */
    displayFortune() {
        if (!this.currentFortune) return;
        
        const fortune = this.currentFortune;
        
        // 顯示運勢等級
        document.getElementById('fortuneLevel').textContent = fortune.level;
        document.getElementById('fortuneLevel').style.color = fortune.color;
        
        // 顯示解籤
        document.getElementById('fortuneInterpretation').textContent = fortune.interpretation;
        
        // 顯示幸運色
        const colorBlock = document.getElementById('luckyColorBlock');
        // 強制設置背景色並移除其他可能的樣式
        colorBlock.style.cssText = `
            background-color: ${fortune.luckyColor.hex} !important;
            background-image: none !important;
            background: ${fortune.luckyColor.hex} !important;
        `;
        document.getElementById('luckyColorName').textContent = fortune.luckyColor.name;
        
        // 顯示幸運數字
        document.getElementById('luckyNumber').textContent = fortune.luckyNumber;
        
        // 顯示幸運物品
        document.getElementById('luckyItem').textContent = fortune.luckyItem.item;
        document.getElementById('itemSuggestion').textContent = fortune.luckyItem.suggestion;
        
        // 顯示幸運方向
        document.getElementById('luckyDirection').textContent = fortune.luckyDirection;
        
        // 顯示詳細資訊
        document.getElementById('fortuneDetails').style.display = 'block';
        
        // 顯示逆天改命按鈕
        document.getElementById('redrawFortune').style.display = 'inline-flex';
        
        // 隱藏抽籤按鈕
        document.getElementById('drawFortune').style.display = 'none';
    }

    /**
     * 逆天改命（重新抽籤）
     */
    redrawFortune() {
        // 避免兩次完全相同，最多重抽一次
        const previousFortune = this.currentFortune;
        
        this.drawFortune();
        
        // 如果兩次結果完全相同，再抽一次
        if (this.isSameFortune(previousFortune, this.currentFortune)) {
            this.drawFortune();
        }
        
        // 確保新運勢已保存到日曆並更新顯示
        this.saveFortuneToCalendar();
        
        window.app.showToast('逆天改命成功！新運勢已更新到日曆', 'success');
    }

    /**
     * 檢查兩次運勢是否完全相同
     */
    isSameFortune(fortune1, fortune2) {
        if (!fortune1 || !fortune2) return false;
        
        return fortune1.level === fortune2.level &&
               fortune1.interpretation === fortune2.interpretation &&
               fortune1.luckyColor.name === fortune2.luckyColor.name &&
               fortune1.luckyNumber === fortune2.luckyNumber &&
               fortune1.luckyItem.item === fortune2.luckyItem.item &&
               fortune1.luckyDirection === fortune2.luckyDirection;
    }

    /**
     * 儲存運勢到日曆
     */
    saveFortuneToCalendar() {
        if (!this.currentFortune) {
            console.warn('無法儲存運勢：沒有運勢資料');
            return;
        }
        
        const today = this.getTodayDateString();
        const fortuneEntry = {
            date: today,
            level: this.currentFortune.level,
            color: this.currentFortune.color,
            interpretation: this.currentFortune.interpretation,
            luckyColor: this.currentFortune.luckyColor,
            luckyNumber: this.currentFortune.luckyNumber,
            luckyItem: this.currentFortune.luckyItem,
            luckyDirection: this.currentFortune.luckyDirection,
            drawnAt: this.currentFortune.drawnAt
        };
        
        try {
            // 儲存運勢記錄
            window.storageManager.saveFortuneEntry(fortuneEntry);
            console.log('運勢已儲存到日曆:', today, this.currentFortune.level);
            
            // 強制更新日曆顯示
            if (window.calendarManager) {
                window.calendarManager.render();
                console.log('日曆已更新顯示');
            } else {
                console.warn('日曆管理器未找到');
            }
        } catch (error) {
            console.error('儲存運勢失敗:', error);
            window.app.showToast('儲存運勢失敗', 'error');
        }
    }

    /**
     * 重置運勢頁面
     */
    reset() {
        this.currentFortune = null;
        
        // 重置顯示
        document.getElementById('fortuneLevel').textContent = '點擊抽籤開始';
        document.getElementById('fortuneLevel').style.color = '';
        document.getElementById('fortuneDetails').style.display = 'none';
        document.getElementById('redrawFortune').style.display = 'none';
        document.getElementById('drawFortune').style.display = 'inline-flex';
    }

    /**
     * 取得今日運勢（如果已抽取）
     */
    getTodayFortune() {
        if (!this.currentFortune) return null;
        
        const today = this.getTodayDateString();
        const fortuneDate = this.currentFortune.drawnAt.split('T')[0];
        
        return today === fortuneDate ? this.currentFortune : null;
    }

    /**
     * 儲存運勢記錄
     */
    saveFortuneRecord() {
        if (!this.currentFortune) return;
        
        const records = this.getFortuneRecords();
        const today = this.getTodayDateString();
        
        // 檢查是否已有今日記錄
        const existingIndex = records.findIndex(record => record.date === today);
        
        if (existingIndex !== -1) {
            // 更新現有記錄
            records[existingIndex] = {
                ...this.currentFortune,
                date: today
            };
        } else {
            // 新增記錄
            records.push({
                ...this.currentFortune,
                date: today
            });
        }
        
        localStorage.setItem('fortuneRecords', JSON.stringify(records));
    }

    /**
     * 取得運勢記錄
     */
    getFortuneRecords() {
        const records = localStorage.getItem('fortuneRecords');
        return records ? JSON.parse(records) : [];
    }

    /**
     * 取得運勢統計
     */
    getFortuneStats() {
        const records = this.getFortuneRecords();
        const stats = {};
        
        records.forEach(record => {
            stats[record.level] = (stats[record.level] || 0) + 1;
        });
        
        return {
            total: records.length,
            byLevel: stats
        };
    }

    /**
     * 取得最常出現的運勢
     */
    getMostCommonFortune() {
        const stats = this.getFortuneStats();
        let mostCommon = null;
        let maxCount = 0;
        
        for (const [level, count] of Object.entries(stats.byLevel)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = level;
            }
        }
        
        return mostCommon;
    }

    /**
     * 取得運勢趨勢
     */
    getFortuneTrend(days = 7) {
        const records = this.getFortuneRecords();
        const recentRecords = records.slice(-days);
        
        const trend = {
            good: 0,    // 大吉、吉、小吉
            neutral: 0, // 平
            bad: 0      // 兇、大凶
        };
        
        recentRecords.forEach(record => {
            if (['大吉', '吉', '小吉'].includes(record.level)) {
                trend.good++;
            } else if (record.level === '平') {
                trend.neutral++;
            } else {
                trend.bad++;
            }
        });
        
        return trend;
    }

    /**
     * 分享運勢
     */
    shareFortune() {
        if (!this.currentFortune) {
            window.app.showToast('請先抽取運勢！', 'warning');
            return;
        }
        
        const fortune = this.currentFortune;
        const shareText = `今日運勢：${fortune.level}\n解籤：${fortune.interpretation}\n幸運色：${fortune.luckyColor.name}\n幸運數字：${fortune.luckyNumber}\n幸運物品：${fortune.luckyItem.item}\n幸運方向：${fortune.luckyDirection}`;
        
        if (navigator.share) {
            navigator.share({
                title: '今日運勢',
                text: shareText
            }).catch(() => {
                this.copyToClipboard(shareText);
            });
        } else {
            this.copyToClipboard(shareText);
        }
    }

    /**
     * 複製到剪貼簿
     */
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                window.app.showToast('運勢已複製到剪貼簿！', 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    /**
     * 備用複製方法
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            window.app.showToast('運勢已複製到剪貼簿！', 'success');
        } catch (err) {
            window.app.showToast('複製失敗', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

// 建立全域運勢管理器實例
window.fortuneManager = new FortuneManager();
