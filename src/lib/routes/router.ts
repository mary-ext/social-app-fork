import type { Route, RouteBuildParams, RouteParams } from './types';

export class Router<T extends Record<string, unknown>> {
	routes: [string, Route][] = [];
	constructor(description: Record<keyof T, string>) {
		for (const [screen, pattern] of Object.entries<string>(description)) {
			this.routes.push([screen, createRoute(pattern)]);
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
	const matcherReInternal = pattern.replace(/:([\w]+)/g, (_m, name) => {
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
 * decodes a percent-encoded path parameter so screens receive it unescaped.
 *
 * @param value raw path segment captured by the route matcher
 * @returns decoded value, or the input unchanged if percent-encoding is invalid
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
