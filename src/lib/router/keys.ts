import type { MatchedNode } from './match.ts';

// encoded values cannot contain the null separator.
const SEP = '\u0000';

/**
 * serializes path parameters into a stable, sorted, percent-encoded string.
 *
 * query parameters are excluded because they represent view state rather than instance identity.
 */
const canonical = (matched: MatchedNode): string => {
	const codecs = matched.node.params;
	return Object.keys(codecs)
		.toSorted()
		.map((name) => {
			const codec = codecs[name];
			if (codec === undefined) {
				throw new Error(`stacker: no codec for param '${name}' on node '${matched.node.id}'`);
			}
			return `${encodeURIComponent(name)}=${encodeURIComponent(codec.encode(matched.params[name]))}`;
		})
		.join('&');
};

/**
 * generates the instance key for a node, determining if a view is reused or remounted.
 *
 * layouts and singleton leaves are keyed by node id and serialized path parameters, while page leaves are
 * keyed by node id and the history slot they were reached through — one instance per entry, which is what
 * makes a push a fresh screen and a traversal the one you left.
 */
export const instanceKey = (matched: MatchedNode, entryKey: string): string => {
	const resolved = matched.node;
	if (resolved.kind === 'layout') {
		return `${resolved.id}${SEP}${canonical(matched)}`;
	}
	const type = resolved.node.kind === 'route' ? (resolved.node.type ?? 'page') : 'page';
	return type === 'singleton'
		? `${resolved.id}${SEP}${canonical(matched)}`
		: `${resolved.id}${SEP}entry:${entryKey}`;
};
