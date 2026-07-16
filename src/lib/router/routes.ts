import type { ComponentType, ReactNode } from 'react';

import type { BuildShape, CodecRecord, DecodeShape, Infer } from './codec.ts';
import { getDefault, isOptional } from './codec.ts';

// #region node definitions

type Empty = Record<never, never>;

/**
 * defines how a leaf route instance is keyed.
 *
 * - `page` — one instance per history entry.
 * - `singleton` — one instance per distinct set of path parameters, shared across entries.
 */
export type LeafType = 'page' | 'singleton';

/**
 * application-defined metadata attached to routes or layouts.
 *
 * stacker does not read these values, and declares no fields of its own. an application declares the ones it
 * needs and reads them back off the active chain with `resolveMeta`.
 *
 * ```ts
 * declare module '@oomfware/stacker' {
 * 	interface RouteMeta {
 * 		readonly requireAuth?: boolean;
 * 	}
 * }
 * ```
 */
// oxlint-disable-next-line typescript/no-empty-object-type -- the host app fills this in by declaration merging
export interface RouteMeta {}

/** a read-only view of {@link URLSearchParams} that omits its mutating members. */
export type ReadonlyURLSearchParams = Omit<URLSearchParams, 'append' | 'delete' | 'set' | 'sort'>;

/** context passed to a route `when` predicate. */
export interface WhenContext {
	readonly hash: string;
	readonly pathname: string;
	readonly rawSearch: ReadonlyURLSearchParams;
	readonly search: string;
}

interface LeafShared<Params extends CodecRecord, Query extends CodecRecord> {
	/** component to render. */
	readonly component: ComponentType;
	/** suspense fallback component. */
	readonly fallback?: ReactNode;
	/** application metadata. */
	readonly meta?: RouteMeta;
	/** path parameter codecs. */
	readonly params?: Params;
	/** absolute URL path pattern. */
	readonly path: string;
	/** query parameter codecs. */
	readonly query?: Query;
	/** instance-keying strategy. */
	readonly type?: LeafType;
	/** dynamic predicate for route matching. */
	readonly when?: (ctx: WhenContext) => boolean;
}

/** configuration for a navigable leaf route. */
export type RouteConfig<Params extends CodecRecord, Query extends CodecRecord> = LeafShared<Params, Query>;

/** a navigable leaf route node. */
export interface RouteLeaf<
	Params extends CodecRecord = Empty,
	Query extends CodecRecord = Empty,
> extends LeafShared<Params, Query> {
	readonly kind: 'route';
}

/** configuration for an interior layout node. */
export interface LayoutConfig<Children extends RouteChildren, Params extends CodecRecord> {
	/** nested child nodes. */
	readonly children: Children;
	/** layout component rendering an outlet. */
	readonly component: ComponentType;
	/** suspense fallback component. */
	readonly fallback?: ReactNode;
	/** application metadata. */
	readonly meta?: RouteMeta;
	/**
	 * codecs for layout parameters. parameter names must appear in all descendant leaf paths, allowing layouts
	 * to decode their own values.
	 */
	readonly params?: Params;
}

/** an interior layout node. */
export type LayoutNode<Children extends RouteChildren = RouteChildren, Params extends CodecRecord = Empty> = {
	readonly kind: 'layout';
} & LayoutConfig<Children, Params>;

/** a layout or leaf route node. */
export type RouteNode = LayoutNode | RouteLeaf;

/** a record of child nodes. */
export interface RouteChildren {
	readonly [name: string]: RouteNode;
}

/**
 * defines a navigable leaf route.
 *
 * @param config the route configuration
 * @returns the route leaf node
 */
export const route = <const Params extends CodecRecord = Empty, const Query extends CodecRecord = Empty>(
	config: RouteConfig<Params, Query>,
): RouteLeaf<Params, Query> => ({ kind: 'route', ...config });

/**
 * defines an interior layout node.
 *
 * @param config the layout configuration
 * @returns the layout node
 */
export const layout = <const Children extends RouteChildren, const Params extends CodecRecord = Empty>(
	config: LayoutConfig<Children, Params>,
): LayoutNode<Children, Params> => ({ kind: 'layout', ...config });

// #endregion

// #region resolved (runtime) structures

/** a node resolved with an id and normalized parameters. */
export interface ResolvedNode {
	/** unique dot-separated node path. */
	readonly id: string;
	/** key name within the parent record. */
	readonly key: string;
	readonly kind: 'layout' | 'route';
	readonly node: RouteNode;
	/** local parameter codecs. */
	readonly params: CodecRecord;
	/** absolute path pattern if a route. */
	readonly path: string | undefined;
}

/** a leaf node resolved with its ancestors and metadata. */
export interface ResolvedLeaf {
	/** ancestors list from root to leaf. */
	readonly chain: readonly ResolvedNode[];
	readonly leaf: RouteLeaf;
	/** unique route name. */
	readonly name: string;
	/** path parameter codecs. */
	readonly params: CodecRecord;
	/** absolute path pattern. */
	readonly path: string;
	/** query parameter codecs. */
	readonly query: CodecRecord;
}

/** a compiled registry of routes and nodes. */
export interface RouteRegistry<T> {
	/** resolved leaves in matching order. */
	readonly leaves: ReadonlyMap<string, ResolvedLeaf>;
	readonly tree: T;
}

const PATH_PARAM = /:([A-Za-z_]\w*)/g;

const pathParamNames = (path: string): string[] => {
	const names: string[] = [];
	for (const match of path.matchAll(PATH_PARAM)) {
		const name = match[1];
		if (name !== undefined) {
			names.push(name);
		}
	}
	return names;
};

const sameKeySet = (a: readonly string[], b: readonly string[]): boolean => {
	if (a.length !== b.length) {
		return false;
	}
	const set = new Set(a);
	return b.every((key) => set.has(key));
};

// an index-signature constraint would widen defaulted generics and disrupt downstream inference.
type ValidRoutes<T> = { readonly [K in keyof T]: T[K] extends RouteNode ? T[K] : never };

/**
 * compiles a route tree, validating keys, paths, and parameter codecs.
 *
 * @param tree the route tree configuration
 * @returns the compiled registry
 * @throws when route definitions violate nesting, unique names, or codec constraints
 */
export const defineRoutes = <const T>(tree: T & ValidRoutes<T>): RouteRegistry<T> => {
	const leaves = new Map<string, ResolvedLeaf>();
	const ids = new Set<string>();

	const visit = (children: RouteChildren, parentChain: readonly ResolvedNode[], parentId: string): void => {
		for (const [key, node] of Object.entries(children)) {
			if (key.includes('.')) {
				throw new Error(`stacker: route key '${key}' must not contain '.'`);
			}
			const id = parentId ? `${parentId}.${key}` : key;
			if (ids.has(id)) {
				throw new Error(`stacker: duplicate node id '${id}'`);
			}
			const params: CodecRecord = node.params ?? {};
			const resolved: ResolvedNode = {
				id,
				key,
				kind: node.kind,
				node,
				params,
				path: node.kind === 'route' ? node.path : undefined,
			};
			ids.add(id);
			const chain = [...parentChain, resolved];

			if (node.kind === 'layout') {
				visit(node.children, chain, id);
				continue;
			}

			if (leaves.has(key)) {
				throw new Error(`stacker: duplicate route name '${key}'`);
			}
			if (!node.path.startsWith('/')) {
				throw new Error(`stacker: route '${key}' path '${node.path}' must start with '/'`);
			}

			const query: CodecRecord = node.query ?? {};
			const ownPathParams = pathParamNames(node.path);
			const declaredParams = Object.keys(params);

			if (!sameKeySet(ownPathParams, declaredParams)) {
				throw new Error(
					`stacker: route '${key}' path params [${ownPathParams.join(', ')}] do not match declared params [${declaredParams.join(', ')}]`,
				);
			}
			for (const [paramName, codec] of Object.entries(params)) {
				if (isOptional(codec) || getDefault(codec) !== undefined) {
					throw new Error(
						`stacker: path param '${paramName}' of route '${key}' must not be optional() or withDefault()`,
					);
				}
			}
			for (const queryKey of Object.keys(query)) {
				if (queryKey in params) {
					throw new Error(`stacker: route '${key}' declares '${queryKey}' as both a path and query param`);
				}
			}
			for (const ancestor of chain) {
				if (ancestor.kind !== 'layout') {
					continue;
				}
				for (const layoutParam of Object.keys(ancestor.params)) {
					if (!ownPathParams.includes(layoutParam)) {
						throw new Error(
							`stacker: layout '${ancestor.id}' param '${layoutParam}' is not present in route '${key}' path '${node.path}'`,
						);
					}
				}
			}

			leaves.set(key, { chain, leaf: node, name: key, params, path: node.path, query });
		}
	};

	visit(tree, [], '');

	return { leaves, tree };
};

// #endregion

// #region type-level derivation

type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void
	? I
	: never;

export type FlattenChildren<C> = UnionToIntersection<
	{
		[K in keyof C]: C[K] extends { readonly children: infer GC; readonly kind: 'layout' }
			? FlattenChildren<GC>
			: C[K] extends { readonly kind: 'route' }
				? { readonly [P in K]: C[K] }
				: never;
	}[keyof C]
>;

type LeavesMap<R> = R extends RouteRegistry<infer T> ? FlattenChildren<T> : never;

type Prettify<T> = { [K in keyof T]: T[K] } & {};

// path parameters are required; removing `readonly` accepts plain object literals.
type PathShape<P extends CodecRecord> = { -readonly [K in keyof P]: Infer<P[K]> };

type LeafDecode<L> = L extends RouteLeaf<infer P, infer Q> ? Prettify<DecodeShape<Q> & PathShape<P>> : never;
type LeafBuild<L> = L extends RouteLeaf<infer P, infer Q> ? Prettify<BuildShape<Q> & PathShape<P>> : never;

/** a union of all navigable route names. */
export type RouteName<R> = keyof LeavesMap<R> & string;

/** the decoded parameter shape for a route name. */
export type ParamsOf<R, K extends RouteName<R>> = LeafDecode<LeavesMap<R>[K]>;

/** the parameter shape required to build a URL or navigate to a route. */
export type BuildParamsOf<R, K extends RouteName<R>> = LeafBuild<LeavesMap<R>[K]>;

// #endregion
