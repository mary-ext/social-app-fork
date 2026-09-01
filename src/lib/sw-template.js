/* global ASSETS, CACHE, PRECACHE */

const SHELL = '/';

const PRECACHE_CONCURRENCY = 6;
const isShellFallback = (response) => !!response.headers.get('content-type')?.startsWith('text/html');

const precache = async (cache) => {
	const queue = PRECACHE.slice();

	await Promise.all(
		Array.from({ length: PRECACHE_CONCURRENCY }, async () => {
			let url;
			while ((url = queue.pop()) !== undefined) {
				const response = await fetch(url);
				if (!response.ok || isShellFallback(response)) {
					throw new Error(`precache failed: ${url} (${response.status})`);
				}

				await cache.put(url, response);
			}
		}),
	);
};

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await self.caches.open(CACHE);

			await precache(cache);
			await cache.add(new Request(SHELL, { cache: 'reload' }));
		})(),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
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

	// serve content-hashed assets cache-first.
	if (url.pathname.startsWith(ASSETS)) {
		event.respondWith(
			self.caches.open(CACHE).then(async (cache) => {
				const cached = await cache.match(request);
				if (cached) {
					return cached;
				}

				const response = await fetch(request);
				if (response.ok && !isShellFallback(response)) {
					event.waitUntil(cache.put(request, response.clone()));
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

		return;
	}
});
