/**
 * 心情手札 Moodfolio - Service Worker
 * 負責離線快取和背景同步
 */

const CACHE_NAME = 'moodfolio-v1.0.0';
const STATIC_CACHE = 'moodfolio-static-v1.0.0';
const DYNAMIC_CACHE = 'moodfolio-dynamic-v1.0.0';

// 需要快取的靜態資源
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './styles/main.css',
    './styles/components.css',
    './styles/themes.css',
    './js/app.js',
    './js/data.js',
    './js/storage.js',
    './js/calendar.js',
    './js/quotes.js',
    './js/fortune.js',
    './js/stats.js',
    './js/ui.js',
    './js/pwa.js',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './icons/favicon.png'
];

// 需要快取的動態資源
const DYNAMIC_ASSETS = [
    './api/mood-entries',
    './api/favorites',
    './api/settings'
];

// 安裝事件
self.addEventListener('install', (event) => {
    console.log('Service Worker 安裝中...');
    
    event.waitUntil(
        Promise.all([
            // 快取靜態資源
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('快取靜態資源');
                return cache.addAll(STATIC_ASSETS);
            }),
            // 快取動態資源
            caches.open(DYNAMIC_CACHE).then((cache) => {
                console.log('快取動態資源');
                return cache.addAll(DYNAMIC_ASSETS);
            })
        ]).then(() => {
            console.log('Service Worker 安裝完成');
            return self.skipWaiting();
        })
    );
});

// 啟動事件
self.addEventListener('activate', (event) => {
    console.log('Service Worker 啟動中...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 刪除舊的快取
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('刪除舊快取:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker 啟動完成');
            return self.clients.claim();
        })
    );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 只處理同源請求
    if (url.origin !== location.origin) {
        return;
    }
    
    // 處理不同類型的請求
    if (request.method === 'GET') {
        event.respondWith(handleGetRequest(request));
    } else if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
        event.respondWith(handleApiRequest(request));
    }
});

// 處理 GET 請求
async function handleGetRequest(request) {
    const url = new URL(request.url);
    
    try {
        // 嘗試從網路獲取
        const networkResponse = await fetch(request);
        
        // 如果是成功的回應，快取它
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('網路請求失敗，嘗試從快取獲取:', request.url);
        
        // 從快取獲取
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 如果是 HTML 請求，返回離線頁面
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
        }
        
        // 其他情況返回錯誤
        return new Response('離線模式，無法獲取資源', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// 處理 API 請求
async function handleApiRequest(request) {
    const url = new URL(request.url);
    
    try {
        // 嘗試網路請求
        const response = await fetch(request);
        
        // 如果是成功的回應，快取 GET 請求的結果
        if (response.ok && request.method === 'POST') {
            const getRequest = new Request(url.pathname, { method: 'GET' });
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(getRequest, response.clone());
        }
        
        return response;
    } catch (error) {
        console.log('API 請求失敗:', request.url);
        
        // 對於某些 API 請求，返回離線回應
        if (url.pathname === '/api/mood-entries') {
            return new Response(JSON.stringify([]), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (url.pathname === '/api/favorites') {
            return new Response(JSON.stringify([]), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (url.pathname === '/api/settings') {
            return new Response(JSON.stringify({
                theme: 'auto',
                notifications: { enabled: false, time: '20:00' }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response('離線模式，無法處理請求', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// 背景同步
self.addEventListener('sync', (event) => {
    console.log('背景同步事件:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// 執行背景同步
async function doBackgroundSync() {
    try {
        // 這裡可以執行離線時的資料同步
        console.log('執行背景同步...');
        
        // 例如：同步本地儲存的資料到伺服器
        // const moodEntries = await getLocalMoodEntries();
        // await syncToServer(moodEntries);
        
    } catch (error) {
        console.error('背景同步失敗:', error);
    }
}

// 推送通知
self.addEventListener('push', (event) => {
    console.log('收到推送通知');
    
    const options = {
        body: event.data ? event.data.text() : '記得記錄今天的心情哦！',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '開啟應用程式',
                icon: './icons/icon-192x192.png'
            },
            {
                action: 'close',
                title: '關閉',
                icon: './icons/icon-192x192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('心情手札提醒', options)
    );
});

// 通知點擊事件
self.addEventListener('notificationclick', (event) => {
    console.log('通知被點擊:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // 開啟應用程式
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

// 通知關閉事件
self.addEventListener('notificationclose', (event) => {
    console.log('通知被關閉');
});

// 錯誤處理
self.addEventListener('error', (event) => {
    console.error('Service Worker 錯誤:', event.error);
});

// 未處理的 Promise 拒絕
self.addEventListener('unhandledrejection', (event) => {
    console.error('未處理的 Promise 拒絕:', event.reason);
});

// 定期清理快取
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(cleanupCache());
    }
});

// 清理快取
async function cleanupCache() {
    try {
        const cacheNames = await caches.keys();
        const now = Date.now();
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            for (const request of requests) {
                const response = await cache.match(request);
                const headers = response.headers;
                const date = headers.get('date');
                
                if (date) {
                    const responseDate = new Date(date).getTime();
                    const age = now - responseDate;
                    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
                    
                    if (age > maxAge) {
                        await cache.delete(request);
                    }
                }
            }
        }
        
        console.log('快取清理完成');
    } catch (error) {
        console.error('快取清理失敗:', error);
    }
}
