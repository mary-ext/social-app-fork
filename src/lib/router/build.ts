import { getDefault, isOptional } from './codec.ts';
import type { BuildParamsOf, RouteName, RouteRegistry } from './routes.ts';
import { createPath } from './url.ts';

const SEGMENT = /:([A-Za-z_]\w*)/g;

export type BuildArgs<R, K extends RouteName<R>> =
	Record<never, never> extends BuildParamsOf<R, K>
		? [params?: BuildParamsOf<R, K>]
		: [params: BuildParamsOf<R, K>];

export class Builder<R extends RouteRegistry<unknown> = RouteRegistry<unknown>> {
	readonly #registry: R;

	constructor(registry: R) {
		this.#registry = registry;
	}

	build<K extends RouteName<R>>(name: K, ...args: BuildArgs<R, K>): string {
		return this.buildPath(name, args[0] ?? {});
	}

	buildPath(name: string, params: Readonly<Record<string, unknown>> = {}): string {
		const leaf = this.#registry.leaves.get(name);
		if (leaf === undefined) {
			throw new Error(`stacker: unknown route '${name}'`);
		}

		const pathname = leaf.path.replaceAll(SEGMENT, (_full, paramName: string) => {
			const codec = leaf.params[paramName];
			const value = params[paramName];
			if (codec === undefined || value === undefined) {
				throw new Error(`stacker: missing path param '${paramName}' for route '${name}'`);
			}
			return encodeURIComponent(codec.encode(value));
		});

		const search = new URLSearchParams();
		for (const [paramName, codec] of Object.entries(leaf.query)) {
			const value = params[paramName];
			if (value === undefined) {
				if (!isOptional(codec) && getDefault(codec) === undefined) {
					throw new Error(`stacker: missing required query param '${paramName}' for route '${name}'`);
				}
				continue;
			}
			search.set(paramName, codec.encode(value));
		}
		const query = search.toString();

		return createPath({ hash: '', pathname, search: query ? `?${query}` : '' });
	}
}
