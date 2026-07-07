type DiagEvent = { t: number; event: string; data?: Record<string, unknown> };

declare global {
	interface Window {
		bsky_session_debug?: DiagEvent[];
	}
}

export function diag(event: string, data?: Record<string, unknown>) {
	if (typeof window === 'undefined') {
		return;
	}
	const buffer = (window.bsky_session_debug ??= []);
	buffer.push({ t: Math.round(performance.now()), event, data });
}

if (typeof window !== 'undefined') {
	window.addEventListener('unhandledrejection', (ev) =>
		diag('window:unhandledrejection', errInfo(ev.reason)),
	);
	window.addEventListener('error', (ev) => diag('window:error', { message: ev.message }));
}

export function errInfo(e: unknown): Record<string, unknown> {
	return e instanceof Error ? { message: e.message, name: e.name } : { value: String(e) };
}

export function diagUrl(url: string): string {
	const afterXrpc = url.split('/xrpc/')[1] ?? url;
	return afterXrpc.split('?')[0] ?? afterXrpc;
}
