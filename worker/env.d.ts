/**
 * vars that `wrangler types` can't see, because they're injected by the dev command rather than declared in
 * `wrangler.jsonc`.
 */
declare namespace Cloudflare {
	interface Env {
		/**
		 * set by `pnpm dev:worker` and by nothing else. a deployed worker leaves it undefined, so anything that
		 * relaxes a check for local development fails closed in production.
		 */
		DEV?: 'true';
	}
}
