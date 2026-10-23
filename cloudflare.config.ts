import { bindings, defineConfig } from 'cf/config';

export default defineConfig({
	worker: {
		name: 'social-app-fork',
		entrypoint: './worker/index.ts',
		compatibilityDate: '2026-05-19',
		compatibilityFlags: ['global_fetch_strictly_public'],
		assets: {
			notFoundHandling: 'single-page-application',
			runWorkerFirst: ['/.well-known/did.json', '/oauth-client-metadata.json', '/xrpc/*'],
		},
		env: {
			AI: bindings.ai(),
			AI_LIMITER: bindings.rateLimit({
				namespace: '1001',
				simple: { limit: 20, period: 60 },
			}),
			OAUTH_PRIVATE_KEY: bindings.secret(),
		},
	},
});
