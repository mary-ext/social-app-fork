export interface PathParts {
	hash: string;
	pathname: string;
	search: string;
}

export const parsePath = (to: string): PathParts => {
	let pathname = to;
	let search = '';
	let hash = '';

	const hashIndex = pathname.indexOf('#');
	if (hashIndex >= 0) {
		hash = pathname.slice(hashIndex);
		pathname = pathname.slice(0, hashIndex);
	}

	const searchIndex = pathname.indexOf('?');
	if (searchIndex >= 0) {
		search = pathname.slice(searchIndex);
		pathname = pathname.slice(0, searchIndex);
	}

	return { hash, pathname, search };
};

export const resolvePath = (to: string, base: PathParts): PathParts => {
	const resolved = new URL(to, `http://_${createPath(base)}`);
	return { hash: resolved.hash, pathname: resolved.pathname, search: resolved.search };
};

export const createPath = ({ hash, pathname, search }: PathParts): string => {
	let out = pathname || '/';
	if (search && search !== '?') {
		out += search.startsWith('?') ? search : `?${search}`;
	}
	if (hash && hash !== '#') {
		out += hash.startsWith('#') ? hash : `#${hash}`;
	}
	return out;
};
