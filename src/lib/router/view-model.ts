import { instanceKey } from './keys.ts';
import type { RouteMatch } from './match.ts';
import type { ResolvedNode } from './routes.ts';

export interface PoolEntry {
	/** the history slot this entry occupies, which is also its rendering identity. */
	readonly key: string;
	readonly match: RouteMatch;
}

/** an instance node within the layout tree structure. */
export interface InstanceNode {
	readonly children: InstanceNode[];
	readonly instanceKey: string;
	readonly node: ResolvedNode;
	readonly params: Readonly<Record<string, unknown>>;
}

/** the computed rendering view configuration. */
export interface View {
	/** instance keys along the active chain from root to leaf. */
	readonly activePath: readonly string[];
	/** the top-level pool (instances at the root outlet). */
	readonly roots: readonly InstanceNode[];
}

interface PlacedNode {
	children: PlacedNode[];
	instanceKey: string;
	node: ResolvedNode;
	params: Readonly<Record<string, unknown>>;
}

/**
 * builds the active view and computes which entries and instances to prune.
 *
 * layout instances are shared when sibling entries resolve to matching keys. when multiple entries share an
 * instance, the parameters from the active entry take precedence.
 */
export const computeView = (
	cached: readonly PoolEntry[],
	pinned: readonly PoolEntry[],
	activeKey: string,
): View => {
	const byKey = new Map<string, PlacedNode>();
	const roots: PlacedNode[] = [];

	const place = (entry: PoolEntry, active: boolean): void => {
		let pool = roots;
		for (const matched of entry.match.chain) {
			const key = instanceKey(matched, entry.key);
			let inst = byKey.get(key);
			if (inst === undefined) {
				inst = { children: [], instanceKey: key, node: matched.node, params: matched.params };
				byKey.set(key, inst);
				pool.push(inst);
			} else if (active) {
				inst.params = matched.params;
			}
			pool = inst.children;
		}
	};

	for (const entry of cached) {
		place(entry, entry.key === activeKey);
	}
	for (const entry of pinned) {
		place(entry, false);
	}

	const active = cached.find((entry) => entry.key === activeKey);
	if (active === undefined) {
		throw new Error(`stacker: active entry '${activeKey}' is not in the cached set`);
	}
	const activePath = active.match.chain.map((matched) => instanceKey(matched, active.key));

	return { activePath, roots };
};
