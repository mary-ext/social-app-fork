/* global CACHE, PRECACHE */
// build-time template; the precache plugin prepends `CACHE` and `PRECACHE`.

// cache the SPA shell under `/`; redirected responses cannot satisfy navigations.
const SHELL = '/';

self.addEventListener('install', (event) => {
	event.waitUntil(self.caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// remove older precaches.
			const keys = await self.caches.keys();
			await Promise.all(keys.filter((key) => key !== CACHE).map((key) => self.caches.delete(key)));
			await self.clients.claim();
		})(),
	);
});

// activate a waiting worker after the user accepts an update.
self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') {
		return;
	}
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) {
		return;
	}

	// keep same-origin XRPC requests on the network.
	if (url.pathname.startsWith('/xrpc/')) {
		return;
	}

	// serve content-hashed assets cache-first; mutable root files stay network-driven.
	if (url.pathname.startsWith('/static/')) {
		event.respondWith(
			self.caches.open(CACHE).then(async (cache) => {
				const cached = await cache.match(request);
				if (cached) {
					return cached;
				}
				const response = await fetch(request);
				if (response.ok && response.type === 'basic') {
					cache.put(request, response.clone());
				}
				return response;
			}),
		);
		return;
	}

	// serve the cached shell for navigations, except redirected responses.
	if (request.mode === 'navigate') {
		event.respondWith(
			self.caches.match(SHELL).then((cached) => (cached && !cached.redirected ? cached : fetch(request))),
		);
	}
});
