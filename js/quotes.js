/**
 * 心情手札 Moodfolio - 心靈雞湯管理
 * 負責語錄的顯示和收藏功能
 */

class QuotesManager {
    constructor() {
        this.currentQuote = null;
        this.setupEventListeners();
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 新語錄按鈕
        document.getElementById('newQuote').addEventListener('click', () => {
            this.showRandomQuote();
        });

        // 收藏語錄按鈕
        document.getElementById('favoriteQuote').addEventListener('click', () => {
            this.addToFavorites();
        });
    }

    /**
     * 顯示隨機語錄
     */
    showRandomQuote() {
        const quotes = window.QUOTES_DATA;
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[randomIndex];
        
        this.currentQuote = {
            id: `quote_${Date.now()}_${randomIndex}`,
            text: quote,
            savedAt: new Date().toISOString()
        };
        
        document.getElementById('currentQuote').textContent = quote;
        
        // 顯示收藏按鈕
        document.getElementById('favoriteQuote').style.display = 'inline-flex';
    }

    /**
     * 加入收藏
     */
    addToFavorites() {
        if (!this.currentQuote) {
            window.app.showToast('請先抽一句語錄！', 'warning');
            return;
        }

        // 檢查是否已經收藏
        const favorites = window.storageManager.getFavoriteQuotes();
        const exists = favorites.some(fav => fav.text === this.currentQuote.text);
        
        if (exists) {
            window.app.showToast('這句語錄已經在收藏中了！', 'warning');
            return;
        }

        // 加入收藏
        window.storageManager.addFavoriteQuote(this.currentQuote);
        window.app.showToast('已加入收藏！', 'success');
    }

    /**
     * 渲染收藏清單
     */
    renderFavorites() {
        const favorites = window.storageManager.getFavoriteQuotes();
        const container = document.getElementById('favoritesList');
        
        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>還沒有收藏任何語錄</p>
                    <p>去心靈雞湯頁面抽一句喜歡的語錄吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        // 按收藏時間排序（最新的在前）
        favorites.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

        favorites.forEach(favorite => {
            const favoriteElement = this.createFavoriteElement(favorite);
            container.appendChild(favoriteElement);
        });
    }

    /**
     * 創建收藏項目元素
     */
    createFavoriteElement(favorite) {
        const element = document.createElement('div');
        element.className = 'favorite-item';
        
        const savedDate = new Date(favorite.savedAt);
        const dateString = savedDate.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        element.innerHTML = `
            <div class="favorite-content">
                <div class="favorite-text">${favorite.text}</div>
                <div class="favorite-date">收藏於 ${dateString}</div>
            </div>
            <div class="favorite-actions">
                <button class="btn btn-danger btn-sm" onclick="window.quotesManager.deleteFavorite('${favorite.id}')">
                    刪除
                </button>
            </div>
        `;

        return element;
    }

    /**
     * 刪除收藏
     */
    deleteFavorite(id) {
        window.app.showModal(
            '確認刪除',
            '確定要刪除這句收藏的語錄嗎？',
            [
                { text: '取消', type: 'secondary' },
                { text: '刪除', type: 'danger', action: () => {
                    window.storageManager.deleteFavoriteQuote(id);
                    this.renderFavorites();
                    window.app.showToast('已刪除收藏', 'success');
                }}
            ]
        );
    }

    /**
     * 取得收藏統計
     */
    getFavoritesStats() {
        const favorites = window.storageManager.getFavoriteQuotes();
        return {
            total: favorites.length,
            recent: favorites.filter(fav => {
                const savedDate = new Date(fav.savedAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return savedDate >= weekAgo;
            }).length
        };
    }

    /**
     * 搜尋收藏
     */
    searchFavorites(keyword) {
        const favorites = window.storageManager.getFavoriteQuotes();
        return favorites.filter(fav => 
            fav.text.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    /**
     * 匯出收藏
     */
    exportFavorites() {
        const favorites = window.storageManager.getFavoriteQuotes();
        const data = {
            favorites: favorites,
            exportDate: new Date().toISOString(),
            total: favorites.length
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `favorites_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.app.showToast('收藏匯出成功！', 'success');
    }

    /**
     * 匯入收藏
     */
    importFavorites(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.favorites || !Array.isArray(data.favorites)) {
                    throw new Error('無效的檔案格式');
                }

                window.app.showModal(
                    '匯入收藏',
                    `確定要匯入 ${data.favorites.length} 句收藏語錄嗎？`,
                    [
                        { text: '取消', type: 'secondary' },
                        { text: '合併', type: 'primary', action: () => this.mergeFavorites(data.favorites) },
                        { text: '覆蓋', type: 'danger', action: () => this.overwriteFavorites(data.favorites) }
                    ]
                );
            } catch (error) {
                window.app.showToast('匯入失敗：無效的檔案格式', 'error');
            }
        };
        reader.readAsText(file);
    }

    /**
     * 合併收藏
     */
    mergeFavorites(newFavorites) {
        const existingFavorites = window.storageManager.getFavoriteQuotes();
        let added = 0;

        newFavorites.forEach(fav => {
            const exists = existingFavorites.some(existing => existing.text === fav.text);
            if (!exists) {
                window.storageManager.addFavoriteQuote(fav);
                added++;
            }
        });

        this.renderFavorites();
        window.app.showToast(`成功合併 ${added} 句新語錄！`, 'success');
        window.app.closeModal();
    }

    /**
     * 覆蓋收藏
     */
    overwriteFavorites(newFavorites) {
        // 清除現有收藏
        localStorage.removeItem('favoriteQuotes');
        
        // 匯入新收藏
        newFavorites.forEach(fav => {
            window.storageManager.addFavoriteQuote(fav);
        });

        this.renderFavorites();
        window.app.showToast('收藏覆蓋成功！', 'success');
        window.app.closeModal();
    }

    /**
     * 取得隨機收藏
     */
    getRandomFavorite() {
        const favorites = window.storageManager.getFavoriteQuotes();
        if (favorites.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * favorites.length);
        return favorites[randomIndex];
    }

    /**
     * 顯示隨機收藏
     */
    showRandomFavorite() {
        const favorite = this.getRandomFavorite();
        if (favorite) {
            this.currentQuote = favorite;
            document.getElementById('currentQuote').textContent = favorite.text;
            document.getElementById('favoriteQuote').style.display = 'none'; // 隱藏收藏按鈕
        }
    }
}

// 建立全域心靈雞湯管理器實例
window.quotesManager = new QuotesManager();
