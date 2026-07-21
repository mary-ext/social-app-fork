import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { initServiceWorker } from '#/lib/service-worker';

import { LOCALE } from '#/locale/intl/locale';

import App from '#/App';
import { overwriteGetLocale } from '#/paraglide/runtime';

// the UI locale is fixed for the page session (changing it reloads), so point paraglide at the
// resolved LOCALE and stamp the document language once, up front.
overwriteGetLocale(() => LOCALE);
document.documentElement.lang = LOCALE;

const rootEl = document.getElementById('root');
if (!rootEl) {
	throw new Error('Missing #root element');
}

if (import.meta.env.DEV && window.location.hostname === 'localhost') {
	// OAuth loopback clients must use 127.0.0.1, not localhost. Redirect before
	// mounting so the app only ever renders under the canonical origin.
	const url = new URL(window.location.href);
	url.hostname = '127.0.0.1';
	window.location.replace(url);
} else {
	createRoot(rootEl).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
	// track an already-installed worker (opt-in install lives in Settings); only production builds emit
	// the worker (see ServiceWorkerPrecachePlugin)
	if (import.meta.env.PROD) {
		initServiceWorker();
	}
}
