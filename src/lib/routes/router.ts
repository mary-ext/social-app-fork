import type { Route, RouteBuildParams, RouteParams } from './types';

export class Router<T extends Record<string, unknown>> {
	routes: [string, Route][] = [];
	constructor(description: Record<keyof T, string | string[]>) {
		for (const [screen, pattern] of Object.entries(description)) {
			if (typeof pattern === 'string') {
				this.routes.push([screen, createRoute(pattern)]);
			} else {
				pattern.forEach((subPattern) => {
					this.routes.push([screen, createRoute(subPattern)]);
				});
			}
		}
	}

	matchName(name: keyof T | (string & {})): Route | undefined {
		for (const [screenName, route] of this.routes) {
			if (screenName === name) {
				return route;
			}
		}
	}

	matchPath(path: string): [string, RouteParams] {
		let name = 'NotFound';
		let params: RouteParams = {};
		for (const [screenName, route] of this.routes) {
			const res = route.match(path);
			if (res) {
				name = screenName;
				params = res.params;
				break;
			}
		}
		return [name, params];
	}
}

function createRoute(pattern: string): Route {
	const pathParamNames: Set<string> = new Set();
	let matcherReInternal = pattern.replace(/:([\w]+)/g, (_m, name) => {
		pathParamNames.add(name);
		return `(?<${name}>[^/]+)`;
	});
	const matcherRe = new RegExp(`^${matcherReInternal}([?]|$)`, 'i');
	return {
		match(path) {
			const { pathname, searchParams } = new URL(path, 'http://throwaway.com');
			const addedParams = Object.fromEntries(searchParams.entries());

			const res = matcherRe.exec(pathname);
			if (res) {
				const pathParams: RouteParams = {};
				for (const [name, value] of Object.entries(res.groups ?? {})) {
					pathParams[name] = decodeRouteParam(value);
				}
				return { params: Object.assign(addedParams, pathParams) };
			}
			return undefined;
		},
		build(params: RouteBuildParams = {}) {
			const str = pattern.replace(/:([\w]+)/g, (_m, name) => {
				return stringifyRouteParam(params[encodeURIComponent(name)]) ?? 'undefined';
			});

			let hasQp = false;
			const qp = new URLSearchParams();
			for (const paramName in params) {
				if (!pathParamNames.has(paramName)) {
					const value = params[paramName];
					const stringValue = stringifyRouteParam(value);
					if (stringValue !== undefined) {
						qp.set(paramName, stringValue);
						hasQp = true;
					}
				}
			}

			return str + (hasQp ? `?${qp.toString()}` : '');
		},
	};
}

/**
 * Decodes a percent-encoded path parameter so screens receive it unescaped.
 *
 * a path parameter can reach us percent-encoded — e.g. some static hosts redirect to the escaped form of a
 * url before any application code runs — which decoding here centralizes so individual screens don't each
 * unescape.
 *
 * @param value raw path segment captured by the route matcher
 * @returns the decoded value, or the input unchanged when it is not valid percent-encoding
 */
function decodeRouteParam(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function stringifyRouteParam(value: unknown): string | undefined {
	switch (typeof value) {
		case 'boolean':
		case 'number':
		case 'string':
			return String(value);
		default:
			return undefined;
	}
}
