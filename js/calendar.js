/**
 * 心情手札 Moodfolio - 日曆管理
 * 負責日曆的渲染和互動功能
 */

class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.setupEventListeners();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 月份切換按鈕
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.previousMonth();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.nextMonth();
        });

        // 關閉詳情按鈕
        document.getElementById('closeDetail').addEventListener('click', () => {
            this.hideDetail();
        });

        // 編輯詳情按鈕
        document.getElementById('editDetail').addEventListener('click', () => {
            this.editDetail();
        });

        // 刪除詳情按鈕
        document.getElementById('deleteDetail').addEventListener('click', () => {
            this.deleteDetail();
        });
    }

    /**
     * 渲染日曆
     */
    render() {
        this.updateCalendarTitle();
        this.renderCalendarGrid();
    }

    /**
     * 更新日曆標題
     */
    updateCalendarTitle() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        const title = `${year}年${month}月`;
        document.getElementById('calendarTitle').textContent = title;
    }

    /**
     * 渲染日曆網格
     */
    renderCalendarGrid() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // 取得當月第一天和最後一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // 生成日曆天數
        const days = [];
        const currentDate = new Date(startDate);

        while (currentDate <= lastDay || days.length < 42) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 渲染每一天
        days.forEach(date => {
            const dayElement = this.createDayElement(date);
            grid.appendChild(dayElement);
        });
    }

    /**
     * 創建日期元素
     */
    createDayElement(date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const currentYear = date.getFullYear();
        const currentMonth = date.getMonth();

        // 檢查是否為其他月份的日期
        if (currentYear !== year || currentMonth !== month) {
            dayElement.classList.add('other-month');
        }

        // 檢查是否為今天
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }

        // 檢查是否有心情記錄
        const dateString = this.formatDateToString(date);
        const moodEntry = window.storageManager.getMoodEntry(dateString);
        const fortuneEntry = window.storageManager.getFortuneEntry(dateString);
        
        if (moodEntry) {
            dayElement.classList.add('has-mood');
            dayElement.setAttribute('data-mood', window.MOOD_EMOJIS[moodEntry.mood]);
            dayElement.setAttribute('data-date', dateString);
        }
        
        if (fortuneEntry) {
            dayElement.classList.add('has-fortune');
            dayElement.setAttribute('data-fortune', this.getFortuneSymbol(fortuneEntry.level));
            dayElement.setAttribute('data-date', dateString);
        }

        // 添加點擊事件
        dayElement.addEventListener('click', (e) => {
            this.showDayDetail(date);
        });

        return dayElement;
    }

    /**
     * 取得運勢符號
     */
    getFortuneSymbol(level) {
        const symbols = {
            '大吉': '🌟',
            '吉': '⭐',
            '小吉': '✨',
            '平': '🔘',
            '兇': '⚠️',
            '大凶': '💀'
        };
        return symbols[level] || '🎯';
    }

    /**
     * 顯示日期詳情
     */
    showDayDetail(date) {
        const dateString = this.formatDateToString(date);
        const moodEntry = window.storageManager.getMoodEntry(dateString);
        const fortuneEntry = window.storageManager.getFortuneEntry(dateString);
        
        const detailElement = document.getElementById('calendarDetail');
        const detailDate = document.getElementById('detailDate');
        const detailMood = document.getElementById('detailMood');
        const detailNote = document.getElementById('detailNote');

        // 格式化日期顯示
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        detailDate.textContent = date.toLocaleDateString('zh-TW', options);

        let content = '';
        
        // 顯示心情資訊
        if (moodEntry) {
            content += `<div class="detail-section">
                <h4>心情記錄</h4>
                <div class="mood-info">${window.MOOD_EMOJIS[moodEntry.mood]} ${window.MOOD_NAMES[moodEntry.mood]}</div>
                <div class="mood-note">${moodEntry.note || '沒有筆記'}</div>
            </div>`;
        }
        
                 // 顯示運勢資訊
         if (fortuneEntry) {
             const isToday = dateString === this.getTodayDateString();
             const fortuneTitle = isToday ? '今日運勢' : '運勢記錄';
             const viewButton = isToday ? `<button class="fortune-view-btn" onclick="window.calendarManager.goToFortuneView()">查看完整運勢</button>` : '';
             const deleteButton = `<button class="fortune-delete-btn" onclick="window.calendarManager.deleteFortuneEntry('${dateString}')">刪除運勢</button>`;
             
             content += `<div class="detail-section">
                 <h4>${fortuneTitle}</h4>
                 <div class="fortune-info">
                     <div class="fortune-level" style="color: ${fortuneEntry.color}">${this.getFortuneSymbol(fortuneEntry.level)} ${fortuneEntry.level}</div>
                     <div class="fortune-interpretation">${fortuneEntry.interpretation}</div>
                     <div class="fortune-details">
                         <span class="lucky-color" style="background-color: ${fortuneEntry.luckyColor.hex}"></span>
                         ${fortuneEntry.luckyColor.name} | 
                         數字: ${fortuneEntry.luckyNumber} | 
                         ${fortuneEntry.luckyItem.item} | 
                         ${fortuneEntry.luckyDirection}
                     </div>
                     <div class="fortune-actions">
                         ${viewButton}
                         ${deleteButton}
                     </div>
                 </div>
             </div>`;
         }
        
        if (!moodEntry && !fortuneEntry) {
            content = '<div class="no-data">這一天還沒有任何記錄</div>';
        }

        detailMood.innerHTML = content;
        detailNote.textContent = '';

        // 檢查是否為今天，只有今天才顯示編輯和刪除按鈕
        const isToday = dateString === this.getTodayDateString();
        const editBtn = document.getElementById('editDetail');
        const deleteBtn = document.getElementById('deleteDetail');
        
        if (editBtn && deleteBtn) {
            if (isToday) {
                editBtn.style.display = 'inline-block';
                deleteBtn.style.display = 'inline-block';
            } else {
                editBtn.style.display = 'none';
                deleteBtn.style.display = 'none';
            }
        }

        this.selectedDate = dateString;
        detailElement.style.display = 'block';
    }

    /**
     * 隱藏詳情
     */
    hideDetail() {
        document.getElementById('calendarDetail').style.display = 'none';
        this.selectedDate = null;
    }

    /**
     * 跳轉到運勢頁面
     */
    goToFortuneView() {
        // 隱藏日曆詳情
        this.hideDetail();
        
        // 跳轉到運勢頁面
        if (window.app) {
            window.app.showPage('fortune');
        }
        
        // 確保運勢管理器載入今日運勢
        if (window.fortuneManager) {
            window.fortuneManager.loadTodayFortune();
        }
    }

    /**
     * 編輯詳情
     */
    editDetail() {
        if (this.selectedDate) {
            // 切換到今日心情頁面並載入該日期的資料
            window.app.showPage('today');
            
            // 設置日期選擇器（如果有的話）
            const entry = window.storageManager.getMoodEntry(this.selectedDate);
            if (entry) {
                // 選擇心情
                document.querySelectorAll('.mood-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                const moodBtn = document.querySelector(`[data-mood="${entry.mood}"]`);
                if (moodBtn) {
                    moodBtn.classList.add('selected');
                }
                
                // 設置筆記
                document.getElementById('moodNote').value = entry.note || '';
                
                // 更新日期顯示
                const date = new Date(this.selectedDate);
                const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
                document.getElementById('todayDate').textContent = date.toLocaleDateString('zh-TW', options);
            }
            
            this.hideDetail();
        }
    }

    /**
     * 刪除詳情
     */
    deleteDetail() {
        if (this.selectedDate) {
            window.app.deleteMoodEntry();
        }
    }

    /**
     * 刪除運勢記錄
     */
    deleteFortuneEntry(dateString) {
        if (!dateString) return;
        
        // 顯示確認對話框
        if (window.app) {
            window.app.showModal(
                '確認刪除運勢',
                `確定要刪除 ${dateString} 的運勢記錄嗎？`,
                [
                    { text: '取消', type: 'secondary' },
                    { text: '刪除', type: 'danger', action: () => {
                        try {
                            // 刪除運勢記錄
                            window.storageManager.deleteFortuneEntry(dateString);
                            
                            // 如果是今日運勢，重置運勢管理器
                            const today = this.getTodayDateString();
                            if (dateString === today && window.fortuneManager) {
                                window.fortuneManager.reset();
                            }
                            
                            // 顯示成功訊息
                            window.app.showToast('運勢記錄已刪除', 'success');
                            
                            // 關閉詳情並重新渲染日曆
                            this.hideDetail();
                            this.render();
                        } catch (error) {
                            console.error('刪除運勢失敗:', error);
                            window.app.showToast('刪除運勢失敗', 'error');
                        }
                    }}
                ]
            );
        }
    }

    /**
     * 上一個月
     */
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    /**
     * 下一個月
     */
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    /**
     * 上一年
     */
    previousYear() {
        this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
        this.render();
    }

    /**
     * 下一年
     */
    nextYear() {
        this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
        this.render();
    }

    /**
     * 跳轉到指定日期
     */
    goToDate(date) {
        this.currentDate = new Date(date);
        this.render();
    }

    /**
     * 跳轉到今天
     */
    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    /**
     * 取得當月統計
     */
    getCurrentMonthStats() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        return window.storageManager.getMonthlyStats(year, month);
    }

    /**
     * 更新日曆顯示
     */
    updateDisplay() {
        this.render();
    }

    /**
     * 格式化日期為字串（使用本地時間）
     */
    formatDateToString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
}

// 建立全域日曆管理器實例
window.calendarManager = new CalendarManager();
