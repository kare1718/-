const CACHE_NAME = 'team-kangin-v3';
const OFFLINE_URL = '/offline.html';
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/brand/team-kangin-light.png',
  '/brand/team-kangin-dark.png',
  '/icons/icon-192.png',
];

// 설치 시 오프라인 페이지 및 팀 강인 브랜드 로고 프리캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 오프라인 페이지
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
