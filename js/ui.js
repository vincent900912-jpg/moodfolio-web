/**
 * 心情手札 Moodfolio - UI 管理
 * 負責使用者介面的輔助功能
 */

class UIManager {
    constructor() {
        this.setupEventListeners();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 模態對話框背景點擊關閉
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                window.app.closeModal();
            }
        });

        // 模態對話框關閉按鈕
        document.getElementById('closeModal').addEventListener('click', () => {
            window.app.closeModal();
        });

        // 日曆詳情關閉按鈕
        document.getElementById('closeDetail').addEventListener('click', () => {
            if (window.calendarManager) {
                window.calendarManager.hideDetail();
            }
        });

        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            // ESC 關閉模態對話框
            if (e.key === 'Escape') {
                if (document.getElementById('modal').style.display === 'flex') {
                    window.app.closeModal();
                }
                if (document.getElementById('calendarDetail').style.display !== 'none') {
                    if (window.calendarManager) {
                        window.calendarManager.hideDetail();
                    }
                }
            }
        });
    }

    /**
     * 顯示載入中狀態
     */
    showLoading(element, text = '載入中...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        `;
        
        element.style.position = 'relative';
        element.appendChild(loadingDiv);
        
        return loadingDiv;
    }

    /**
     * 隱藏載入中狀態
     */
    hideLoading(loadingElement) {
        if (loadingElement && loadingElement.parentNode) {
            loadingElement.parentNode.removeChild(loadingElement);
        }
    }

    /**
     * 顯示確認對話框
     */
    showConfirm(message, onConfirm, onCancel) {
        window.app.showModal(
            '確認',
            message,
            [
                { text: '取消', type: 'secondary', action: onCancel },
                { text: '確認', type: 'primary', action: onConfirm }
            ]
        );
    }

    /**
     * 顯示提示對話框
     */
    showAlert(message, title = '提示') {
        window.app.showModal(
            title,
            message,
            [
                { text: '確定', type: 'primary' }
            ]
        );
    }

    /**
     * 顯示輸入對話框
     */
    showPrompt(message, defaultValue = '', onConfirm) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');

        modalTitle.textContent = '輸入';
        modalBody.innerHTML = `
            <p>${message}</p>
            <input type="text" id="promptInput" value="${defaultValue}" class="form-input" placeholder="請輸入...">
        `;

        modalFooter.innerHTML = `
            <button class="btn btn-secondary" onclick="window.app.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="window.uiManager.handlePromptConfirm()">確定</button>
        `;

        modal.style.display = 'flex';
        
        // 聚焦到輸入框
        setTimeout(() => {
            const input = document.getElementById('promptInput');
            input.focus();
            input.select();
        }, 100);

        // 儲存回調函數
        this.promptCallback = onConfirm;
    }

    /**
     * 處理提示確認
     */
    handlePromptConfirm() {
        const input = document.getElementById('promptInput');
        const value = input.value.trim();
        
        if (this.promptCallback) {
            this.promptCallback(value);
        }
        
        window.app.closeModal();
    }

    /**
     * 顯示進度條
     */
    showProgress(element, progress = 0, text = '') {
        let progressBar = element.querySelector('.progress-bar');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.innerHTML = `
                <div class="progress-fill"></div>
                <div class="progress-text"></div>
            `;
            element.appendChild(progressBar);
        }
        
        const fill = progressBar.querySelector('.progress-fill');
        const textElement = progressBar.querySelector('.progress-text');
        
        fill.style.width = `${progress}%`;
        textElement.textContent = text || `${progress}%`;
    }

    /**
     * 隱藏進度條
     */
    hideProgress(element) {
        const progressBar = element.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.remove();
        }
    }

    /**
     * 顯示工具提示
     */
    showTooltip(element, text, position = 'top') {
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${position}`;
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left, top;
        
        switch (position) {
            case 'top':
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                top = rect.top - tooltipRect.height - 5;
                break;
            case 'bottom':
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                top = rect.bottom + 5;
                break;
            case 'left':
                left = rect.left - tooltipRect.width - 5;
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                break;
            case 'right':
                left = rect.right + 5;
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                break;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        
        // 自動隱藏
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 3000);
        
        return tooltip;
    }

    /**
     * 顯示通知
     */
    showNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                ...options
            });
        }
    }

    /**
     * 請求通知權限
     */
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    /**
     * 複製文字到剪貼簿
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // 備用方法
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            }
        } catch (error) {
            console.error('複製失敗:', error);
            return false;
        }
    }

    /**
     * 下載檔案
     */
    downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 格式化日期
     */
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    /**
     * 格式化相對時間
     */
    formatRelativeTime(date) {
        const now = new Date();
        const target = new Date(date);
        const diff = now - target;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}天前`;
        } else if (hours > 0) {
            return `${hours}小時前`;
        } else if (minutes > 0) {
            return `${minutes}分鐘前`;
        } else {
            return '剛剛';
        }
    }

    /**
     * 防抖函數
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 節流函數
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 檢查元素是否在視窗內
     */
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * 滾動到元素
     */
    scrollToElement(element, offset = 0) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * 添加 CSS 樣式
     */
    addStyles(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        return style;
    }

    /**
     * 移除 CSS 樣式
     */
    removeStyles(styleElement) {
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }
    }
}

// 建立全域 UI 管理器實例
window.uiManager = new UIManager();
