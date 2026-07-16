import { getDefault, isOptional } from './codec.ts';
import type { ResolvedLeaf, ResolvedNode, RouteMeta, RouteRegistry, WhenContext } from './routes.ts';

/** a node on a matched chain paired with its instance parameters. */
export interface MatchedNode {
	/** parameters used for instance keying. */
	readonly params: Readonly<Record<string, unknown>>;
	readonly node: ResolvedNode;
}

/** the result of matching a URL, containing the chain, leaf, name, and parameters. */
export interface RouteMatch {
	readonly chain: readonly MatchedNode[];
	readonly leaf: ResolvedLeaf;
	readonly name: string;
	/** leaf parameters, combining path and query. */
	readonly params: Readonly<Record<string, unknown>>;
}

/**
 * looks up the nearest metadata value for a key on a matched chain, searching leaf-first.
 *
 * @param match the route match chain
 * @param key the metadata key to resolve
 * @returns the nearest metadata value, or undefined if none is found
 */
export const resolveMeta = <K extends keyof RouteMeta>(
	match: RouteMatch,
	key: K,
): RouteMeta[K] | undefined => {
	for (let i = match.chain.length - 1; i >= 0; i--) {
		const value = match.chain[i]?.node.node.meta?.[key];
		if (value !== undefined) {
			return value;
		}
	}
	return undefined;
};

interface CompiledLeaf {
	readonly leaf: ResolvedLeaf;
	readonly paramNames: readonly string[];
	readonly regex: RegExp;
}

const SEGMENT = /:[A-Za-z_]\w*/g;

const escapeRegExp = (segment: string): string => segment.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');

const compile = (path: string): { paramNames: string[]; regex: RegExp } => {
	const paramNames: string[] = [];
	let pattern = '';
	let lastIndex = 0;
	for (const match of path.matchAll(SEGMENT)) {
		const whole = match[0];
		const at = match.index;
		if (at === undefined) {
			continue;
		}
		paramNames.push(whole.slice(1));
		pattern += `${escapeRegExp(path.slice(lastIndex, at))}([^/]+)`;
		lastIndex = at + whole.length;
	}
	pattern += escapeRegExp(path.slice(lastIndex));
	const suffix = pattern.endsWith('/') ? '' : '/?';
	return { paramNames, regex: new RegExp(`^${pattern}${suffix}$`) };
};

/** matches URLs in declaration order against a compiled route registry. */
export class Matcher {
	readonly #compiled: readonly CompiledLeaf[];

	constructor(registry: RouteRegistry<unknown>) {
		this.#compiled = [...registry.leaves.values()].map((leaf) => {
			const { paramNames, regex } = compile(leaf.path);
			return { leaf, paramNames, regex };
		});
	}

	match(pathname: string, search = '', hash = ''): RouteMatch | undefined {
		const rawSearch = new URLSearchParams(search);
		const ctx: WhenContext = { hash, pathname, rawSearch, search };

		for (const { leaf, paramNames, regex } of this.#compiled) {
			const execed = regex.exec(pathname);
			if (execed === null) {
				continue;
			}

			const raw = this.#rawValues(paramNames, execed);
			if (raw === undefined) {
				continue;
			}

			const perNode = this.#decodeChain(leaf.chain, raw);
			if (perNode === undefined) {
				continue;
			}

			const query = this.#decodeQuery(leaf, rawSearch);
			if (query === undefined) {
				continue;
			}

			if (leaf.leaf.when && !leaf.leaf.when(ctx)) {
				continue;
			}

			const chain: MatchedNode[] = leaf.chain.map((node) => {
				const own = perNode.get(node.id) ?? {};
				return { node, params: node.kind === 'route' ? { ...own, ...query } : own };
			});
			// the leaf is the last node and always a route, so its chain params are the leaf params.
			return { chain, leaf, name: leaf.name, params: chain.at(-1)?.params ?? {} };
		}

		return undefined;
	}

	#rawValues(paramNames: readonly string[], execed: RegExpExecArray): Record<string, string> | undefined {
		const raw: Record<string, string> = {};
		for (const [i, name] of paramNames.entries()) {
			const value = execed[i + 1];
			if (value === undefined) {
				return undefined;
			}
			try {
				raw[name] = decodeURIComponent(value);
			} catch {
				return undefined;
			}
		}
		return raw;
	}

	#decodeChain(
		chain: readonly ResolvedNode[],
		raw: Record<string, string>,
	): Map<string, Record<string, unknown>> | undefined {
		const perNode = new Map<string, Record<string, unknown>>();
		for (const node of chain) {
			const decoded: Record<string, unknown> = {};
			for (const [name, codec] of Object.entries(node.params)) {
				const rawValue = raw[name];
				if (rawValue === undefined) {
					return undefined;
				}
				const value = codec.decode(rawValue);
				if (value === undefined) {
					return undefined;
				}
				decoded[name] = value;
			}
			perNode.set(node.id, decoded);
		}
		return perNode;
	}

	#decodeQuery(leaf: ResolvedLeaf, rawSearch: URLSearchParams): Record<string, unknown> | undefined {
		const out: Record<string, unknown> = {};
		for (const [name, codec] of Object.entries(leaf.query)) {
			const rawValue = rawSearch.get(name);
			if (rawValue !== null) {
				const value = codec.decode(rawValue);
				if (value === undefined) {
					return undefined;
				}
				out[name] = value;
				continue;
			}
			const fallback = getDefault(codec);
			if (fallback !== undefined) {
				out[name] = fallback[0];
			} else if (!isOptional(codec)) {
				return undefined;
			}
		}
		return out;
	}
}
