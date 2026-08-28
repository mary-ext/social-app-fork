import type { Root, RootContent } from 'hast';
import { createLowlight } from 'lowlight';

import { detectLanguage, LANGUAGES, type LanguageName } from '#/lib/code/grammars';
import { type Line, type Span, splitLines } from '#/lib/code/lines';

const lowlight = createLowlight();

const loads = new Map<LanguageName, Promise<void>>();

function loadLanguage(language: LanguageName): Promise<void> {
	let load = loads.get(language);
	if (!load) {
		load = LANGUAGES[language]()
			.then((mod) => {
				lowlight.register(language, mod.default);
			})
			.catch(() => {
				// fall back to plain text.
			});
		loads.set(language, load);
	}
	return load;
}

function flatten(nodes: RootContent[], inherited: string | undefined, out: Span[]): void {
	for (const node of nodes) {
		switch (node.type) {
			case 'text': {
				out.push({ scope: inherited, value: node.value });
				break;
			}
			case 'element': {
				flatten(node.children, scopeOf(node.properties?.className) ?? inherited, out);
				break;
			}
		}
	}
}

function scopeOf(className: unknown): string | undefined {
	if (!Array.isArray(className)) {
		return undefined;
	}

	const parts = className.map(String);
	const scope = parts.find((part) => part.startsWith('hljs-'));
	if (!scope) {
		return undefined;
	}

	return [scope.slice('hljs-'.length), ...parts.filter((part) => part !== scope)].join('.');
}

function highlightToLines(source: string, language: LanguageName): Line[] {
	const code = splitLines(source).join('\n');

	let tree: Root;
	try {
		tree = lowlight.highlight(language, code);
	} catch {
		// fall back to plain text.
		tree = { type: 'root', children: [{ type: 'text', value: code }] };
	}

	const spans: Span[] = [];
	flatten(tree.children, undefined, spans);

	const lines: Line[] = [];
	let line: Line = [];
	for (const span of spans) {
		const parts = span.value.split('\n');
		for (const [index, part] of parts.entries()) {
			if (index > 0) {
				lines.push(line);
				line = [];
			}
			if (part) {
				line.push({ scope: span.scope, value: part });
			}
		}
	}
	lines.push(line);

	return lines;
}

/**
 * detects and highlights source code.
 *
 * @param contents source to highlight
 * @param filename filename used for detection
 * @returns highlighted lines, or null if unsupported
 */
export async function highlightSource({
	contents,
	filename,
}: {
	contents: string;
	filename: string | undefined;
}): Promise<Line[] | null> {
	const language = detectLanguage({ contents, filename });
	if (!language) {
		return null;
	}

	await loadLanguage(language);
	if (!lowlight.registered(language)) {
		return null;
	}

	return highlightToLines(contents, language);
}
