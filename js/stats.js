/**
 * 心情手札 Moodfolio - 統計管理
 * 負責心情統計和圖表顯示
 */

class StatsManager {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth() + 1;
    }

    /**
     * 渲染統計頁面
     */
    render() {
        this.renderMoodChart();
        this.renderStreakInfo();
    }

    /**
     * 渲染心情分布圖表
     */
    renderMoodChart() {
        const canvas = document.getElementById('moodChart');
        const ctx = canvas.getContext('2d');
        
        // 清除畫布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 取得本月統計資料
        const stats = window.storageManager.getMonthlyStats(this.currentYear, this.currentMonth);
        
        if (stats.total === 0) {
            this.renderEmptyChart(ctx, canvas);
            return;
        }
        
        // 準備資料
        const moodData = this.prepareMoodData(stats.moodCounts);
        
        // 繪製圓餅圖
        this.drawPieChart(ctx, canvas, moodData);
    }

    /**
     * 準備心情資料
     */
    prepareMoodData(moodCounts) {
        const moodData = [];
        const total = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
        
        for (const [mood, count] of Object.entries(moodCounts)) {
            const percentage = (count / total) * 100;
            moodData.push({
                mood: mood,
                count: count,
                percentage: percentage,
                emoji: window.MOOD_EMOJIS[mood],
                name: window.MOOD_NAMES[mood]
            });
        }
        
        // 按數量排序
        moodData.sort((a, b) => b.count - a.count);
        
        return moodData;
    }

    /**
     * 繪製圓餅圖
     */
    drawPieChart(ctx, canvas, data) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        
        let currentAngle = -Math.PI / 2; // 從12點鐘方向開始
        
        // 顏色陣列
        const colors = [
            '#ef4444', '#f97316', '#eab308', '#22c55e',
            '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16'
        ];
        
        data.forEach((item, index) => {
            const sliceAngle = (item.percentage / 100) * 2 * Math.PI;
            const color = colors[index % colors.length];
            
            // 繪製扇形
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            
            // 繪製邊框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 繪製標籤
            this.drawPieLabel(ctx, centerX, centerY, radius, currentAngle + sliceAngle / 2, item);
            
            currentAngle += sliceAngle;
        });
        
        // 繪製中心圓
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 繪製總數
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const total = data.reduce((sum, item) => sum + item.count, 0);
        ctx.fillText(`${total}天`, centerX, centerY);
    }

    /**
     * 繪製圓餅圖標籤
     */
    drawPieLabel(ctx, centerX, centerY, radius, angle, item) {
        const labelRadius = radius * 0.7;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;
        
        // 繪製表情符號
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.emoji, x, y - 10);
        
        // 繪製百分比
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`${item.percentage.toFixed(1)}%`, x, y + 10);
    }

    /**
     * 渲染空圖表
     */
    renderEmptyChart(ctx, canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 繪製空圓圈
        ctx.beginPath();
        ctx.arc(centerX, centerY, 80, 0, 2 * Math.PI);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 繪製文字
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('本月還沒有心情記錄', centerX, centerY - 10);
        ctx.fillText('開始記錄你的每一天吧！', centerX, centerY + 10);
    }

    /**
     * 渲染連續記錄資訊
     */
    renderStreakInfo() {
        const streakDays = window.storageManager.getStreakDays(this.currentYear, this.currentMonth);
        document.getElementById('currentStreak').textContent = streakDays;
    }

    /**
     * 渲染長條圖（替代方案）
     */
    renderBarChart() {
        const canvas = document.getElementById('moodChart');
        const ctx = canvas.getContext('2d');
        
        // 清除畫布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 取得本月統計資料
        const stats = window.storageManager.getMonthlyStats(this.currentYear, this.currentMonth);
        
        if (stats.total === 0) {
            this.renderEmptyChart(ctx, canvas);
            return;
        }
        
        // 準備資料
        const moodData = this.prepareMoodData(stats.moodCounts);
        
        // 繪製長條圖
        this.drawBarChart(ctx, canvas, moodData);
    }

    /**
     * 繪製長條圖
     */
    drawBarChart(ctx, canvas, data) {
        const margin = 40;
        const chartWidth = canvas.width - 2 * margin;
        const chartHeight = canvas.height - 2 * margin;
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;
        
        const maxCount = Math.max(...data.map(item => item.count));
        
        // 繪製座標軸
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // X軸
        ctx.beginPath();
        ctx.moveTo(margin, canvas.height - margin);
        ctx.lineTo(canvas.width - margin, canvas.height - margin);
        ctx.stroke();
        
        // Y軸
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, canvas.height - margin);
        ctx.stroke();
        
        // 繪製長條
        data.forEach((item, index) => {
            const x = margin + index * (barWidth + barSpacing) + barSpacing / 2;
            const barHeight = (item.count / maxCount) * chartHeight;
            const y = canvas.height - margin - barHeight;
            
            // 繪製長條
            ctx.fillStyle = this.getMoodColor(item.mood);
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 繪製數值
            ctx.fillStyle = '#374151';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.count, x + barWidth / 2, y - 5);
            
            // 繪製表情符號
            ctx.font = '16px sans-serif';
            ctx.fillText(item.emoji, x + barWidth / 2, canvas.height - margin + 20);
        });
    }

    /**
     * 取得心情顏色
     */
    getMoodColor(mood) {
        const colors = {
            'HAPPY': '#22c55e',
            'SAD': '#3b82f6',
            'ANGRY': '#ef4444',
            'CALM': '#06b6d4',
            'TIRED': '#8b5cf6',
            'WORRIED': '#f97316',
            'SMILE': '#eab308',
            'LOVE': '#ec4899'
        };
        return colors[mood] || '#6b7280';
    }

    /**
     * 切換圖表類型
     */
    toggleChartType() {
        const canvas = document.getElementById('moodChart');
        const currentType = canvas.dataset.chartType || 'pie';
        
        if (currentType === 'pie') {
            this.renderBarChart();
            canvas.dataset.chartType = 'bar';
        } else {
            this.renderMoodChart();
            canvas.dataset.chartType = 'pie';
        }
    }

    /**
     * 取得詳細統計
     */
    getDetailedStats() {
        const stats = window.storageManager.getMonthlyStats(this.currentYear, this.currentMonth);
        const streakDays = window.storageManager.getStreakDays(this.currentYear, this.currentMonth);
        
        return {
            totalDays: stats.total,
            streakDays: streakDays,
            moodBreakdown: stats.moodCounts,
            averageMood: this.calculateAverageMood(stats.moodCounts),
            mostFrequentMood: this.getMostFrequentMood(stats.moodCounts)
        };
    }

    /**
     * 計算平均心情
     */
    calculateAverageMood(moodCounts) {
        const moodScores = {
            'HAPPY': 8,
            'SMILE': 7,
            'LOVE': 6,
            'CALM': 5,
            'WORRIED': 4,
            'TIRED': 3,
            'SAD': 2,
            'ANGRY': 1
        };
        
        let totalScore = 0;
        let totalCount = 0;
        
        for (const [mood, count] of Object.entries(moodCounts)) {
            totalScore += moodScores[mood] * count;
            totalCount += count;
        }
        
        return totalCount > 0 ? totalScore / totalCount : 0;
    }

    /**
     * 取得最常出現的心情
     */
    getMostFrequentMood(moodCounts) {
        let maxCount = 0;
        let mostFrequent = null;
        
        for (const [mood, count] of Object.entries(moodCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = mood;
            }
        }
        
        return mostFrequent;
    }

    /**
     * 匯出統計報告
     */
    exportStatsReport() {
        const stats = this.getDetailedStats();
        const report = {
            period: `${this.currentYear}年${this.currentMonth}月`,
            totalDays: stats.totalDays,
            streakDays: stats.streakDays,
            moodBreakdown: stats.moodBreakdown,
            averageMood: stats.averageMood,
            mostFrequentMood: stats.mostFrequentMood,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mood_stats_${this.currentYear}_${this.currentMonth.toString().padStart(2, '0')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.app.showToast('統計報告匯出成功！', 'success');
    }
}

// 建立全域統計管理器實例
window.statsManager = new StatsManager();
