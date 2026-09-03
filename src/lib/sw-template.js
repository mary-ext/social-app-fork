/* global ASSETS, CACHE, PRECACHE */

const SHELL = '/';

const RECOVERY_MARKER = '/__sw-recovery';

const PRECACHE_CONCURRENCY = 6;
const isHtml = (response) => !!response.headers.get('content-type')?.startsWith('text/html');

// missing assets may return the shell with 200 text/html.
const isAssetGone = (response) => response.status === 404 || (response.ok && isHtml(response));

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

const reloadOntoCurrentShell = async (clientId) => {
	const client = await self.clients.get(clientId);
	if (client?.type !== 'window') {
		return;
	}

	const response = await fetch(new Request(SHELL, { cache: 'reload' }));
	if (!response.ok || response.redirected || !isHtml(response)) {
		return;
	}

	const cache = await self.caches.open(CACHE);
	const shell = await response.clone().text();

	// avoid retrying recovery for the same shell.
	const marker = await cache.match(RECOVERY_MARKER);
	if (marker && (await marker.text()) === shell) {
		return;
	}

	// seed the cache before reloading to avoid a stale http-cached shell.
	await cache.put(SHELL, response);
	await cache.put(RECOVERY_MARKER, new Response(shell));

	await client.navigate(client.url);
};

const recovering = new Map();
const recover = (clientId) => {
	if (!clientId) {
		return;
	}

	let pending = recovering.get(clientId);
	if (!pending) {
		// coalesce concurrent failures and allow retries after settlement.
		pending = reloadOntoCurrentShell(clientId)
			.catch(() => {})
			.finally(() => recovering.delete(clientId));

		recovering.set(clientId, pending);
	}

	return pending;
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
				if (isAssetGone(response)) {
					// don't serve the shell as a module; recover the window.
					event.waitUntil(recover(event.clientId));
					return Response.error();
				}

				if (response.ok) {
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
