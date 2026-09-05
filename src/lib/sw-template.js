/* global ASSETS, CACHE, PRECACHE */

const SHELL = '/';

const STALE_MARKER = '/__sw-stale';

const PRECACHE_CONCURRENCY = 6;
const isHtml = (response) => !!response.headers.get('content-type')?.startsWith('text/html');

// missing assets may return the shell with 200 text/html.
const isAssetGone = (response) => response.status === 404 || (response.ok && isHtml(response));

let opening;
const openCache = () => (opening ??= self.caches.open(CACHE));

const unavailable = () =>
	new Response(null, {
		status: 503,
		statusText: 'Stale Service Worker Cache',
		headers: { 'cache-control': 'no-store' },
	});

const precache = async (cache) => {
	const queue = PRECACHE.slice();

	await Promise.all(
		Array.from({ length: PRECACHE_CONCURRENCY }, async () => {
			let url;
			while ((url = queue.pop()) !== undefined) {
				const response = await fetch(url);
				if (!response.ok || isHtml(response)) {
					throw new Error(`precache failed: ${url} (${response.status})`);
				}

				await cache.put(url, response);
			}
		}),
	);
};

const markStaleAndReload = async (clientId) => {
	const cache = await openCache();

	// persist before looking up the client.
	if (await cache.match(STALE_MARKER)) {
		return;
	}

	await cache.put(STALE_MARKER, new Response());

	if (!clientId) {
		return;
	}

	const client = await self.clients.get(clientId);
	if (client?.type !== 'window') {
		return;
	}

	await client.navigate(client.url);
};

let recovering;
const recover = (clientId) => {
	// coalesce attempts; the marker survives worker restarts.
	recovering ??= markStaleAndReload(clientId).catch((err) => {
		console.error('service worker recovery failed', err);
	});

	return recovering;
};

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await openCache();

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

			// clear a marker left by a previous worker.
			const cache = await openCache();
			await cache.delete(STALE_MARKER);

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

const serveAsset = async (event) => {
	const request = event.request;
	const cache = await openCache();

	const cached = await cache.match(request);
	if (cached) {
		return cached;
	}

	const response = await fetch(request);
	if (isAssetGone(response)) {
		// don't serve the shell as a module; recover the window.
		event.waitUntil(recover(event.clientId));
		return unavailable();
	}

	if (response.ok) {
		// cache without delaying the response.
		event.waitUntil(cache.put(request, response.clone()));
	}

	return response;
};

const serveNavigation = async (request) => {
	const cache = await openCache();
	const [stale, cached] = await Promise.all([cache.match(STALE_MARKER), cache.match(SHELL)]);

	// don't use a redirect as the shell.
	const shell = cached?.redirected ? undefined : cached;
	if (!shell) {
		return fetch(request);
	}

	// try the network after a stale asset; use the shell offline.
	if (stale) {
		try {
			return await fetch(request);
		} catch {
			// use the cached shell offline.
		}
	}

	return shell;
};

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
		event.respondWith(serveAsset(event));
		return;
	}

	// use the network after a stale asset.
	if (request.mode === 'navigate') {
		event.respondWith(serveNavigation(request));
		return;
	}
});
