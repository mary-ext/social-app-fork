import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '#/App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element');

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
}
