/* global CACHE, PRECACHE */
// build-time template for the precaching service worker. the precache plugin prepends `CACHE` (the
// cache name, keyed by a build hash) and `PRECACHE` (the app-shell asset list) to this source and
// emits it as `sw.js` at the build root. edit this template, not the emitted file.

// the SPA shell's canonical URL. it's precached and served under `/`, not `/index.html`: a host can
// 307-redirect `/index.html` to `/`, and a redirected response can't satisfy a navigation.
const SHELL = '/';

self.addEventListener('install', (event) => {
	event.waitUntil(self.caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// a new precache lives under a new CACHE name; drop every older one
			const keys = await self.caches.keys();
			await Promise.all(keys.filter((key) => key !== CACHE).map((key) => self.caches.delete(key)));
			await self.clients.claim();
		})(),
	);
});

// the page posts this when the user accepts a pending update; without it a waiting worker only
// activates once every tab is closed.
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

	// /xrpc/ is the atproto API surface (served same-origin by the worker) — never cache it and never
	// hand it the SPA shell, so a direct navigation to an /xrpc/ endpoint reaches the network.
	if (url.pathname.startsWith('/xrpc/')) {
		return;
	}

	// everything under /static/ is content-hashed by rsbuild, hence immutable and safe to serve
	// cache-first. the full hashed asset set is precached at install, so this is normally a cache
	// hit; the network fallback only covers an asset the precache somehow missed. non-hashed root
	// files (favicon, oauth metadata) fall through to the network so a changed one can't get pinned
	// to a stale copy.
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

	// SPA navigations resolve to the cached app shell first, falling back to network — keeps the app
	// bootable offline and instant on repeat visits. the shell refreshes whenever a new worker
	// activates with a new precache. a redirected response can't satisfy a navigation, so never serve
	// one from cache: fall back to the network instead of wedging every navigation.
	if (request.mode === 'navigate') {
		event.respondWith(
			self.caches.match(SHELL).then((cached) => (cached && !cached.redirected ? cached : fetch(request))),
		);
	}
});
