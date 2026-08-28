import type { LanguageFn } from 'highlight.js';

// preserve per-grammar chunks.
export const LANGUAGES = {
	bash: () => import('highlight.js/lib/languages/bash'),
	c: () => import('highlight.js/lib/languages/c'),
	cpp: () => import('highlight.js/lib/languages/cpp'),
	csharp: () => import('highlight.js/lib/languages/csharp'),
	css: () => import('highlight.js/lib/languages/css'),
	dart: () => import('highlight.js/lib/languages/dart'),
	diff: () => import('highlight.js/lib/languages/diff'),
	dockerfile: () => import('highlight.js/lib/languages/dockerfile'),
	elixir: () => import('highlight.js/lib/languages/elixir'),
	go: () => import('highlight.js/lib/languages/go'),
	graphql: () => import('highlight.js/lib/languages/graphql'),
	haskell: () => import('highlight.js/lib/languages/haskell'),
	ini: () => import('highlight.js/lib/languages/ini'),
	java: () => import('highlight.js/lib/languages/java'),
	javascript: () => import('highlight.js/lib/languages/javascript'),
	json: () => import('highlight.js/lib/languages/json'),
	kotlin: () => import('highlight.js/lib/languages/kotlin'),
	less: () => import('highlight.js/lib/languages/less'),
	lua: () => import('highlight.js/lib/languages/lua'),
	makefile: () => import('highlight.js/lib/languages/makefile'),
	markdown: () => import('highlight.js/lib/languages/markdown'),
	nix: () => import('highlight.js/lib/languages/nix'),
	perl: () => import('highlight.js/lib/languages/perl'),
	php: () => import('highlight.js/lib/languages/php'),
	protobuf: () => import('highlight.js/lib/languages/protobuf'),
	python: () => import('highlight.js/lib/languages/python'),
	r: () => import('highlight.js/lib/languages/r'),
	ruby: () => import('highlight.js/lib/languages/ruby'),
	rust: () => import('highlight.js/lib/languages/rust'),
	scala: () => import('highlight.js/lib/languages/scala'),
	scss: () => import('highlight.js/lib/languages/scss'),
	sql: () => import('highlight.js/lib/languages/sql'),
	swift: () => import('highlight.js/lib/languages/swift'),
	typescript: () => import('highlight.js/lib/languages/typescript'),
	vim: () => import('highlight.js/lib/languages/vim'),
	xml: () => import('highlight.js/lib/languages/xml'),
	yaml: () => import('highlight.js/lib/languages/yaml'),
} satisfies Record<string, () => Promise<{ default: LanguageFn }>>;

export type LanguageName = keyof typeof LANGUAGES;

// highlight.js uses JS/TS for JSX and INI for TOML.
const EXT_TO_LANG: Record<string, LanguageName> = {
	bash: 'bash',
	c: 'c',
	cc: 'cpp',
	cjs: 'javascript',
	cpp: 'cpp',
	cs: 'csharp',
	css: 'css',
	cts: 'typescript',
	cxx: 'cpp',
	dart: 'dart',
	diff: 'diff',
	dockerfile: 'dockerfile',
	ex: 'elixir',
	exs: 'elixir',
	go: 'go',
	gql: 'graphql',
	graphql: 'graphql',
	h: 'c',
	hpp: 'cpp',
	hs: 'haskell',
	htm: 'xml',
	html: 'xml',
	ini: 'ini',
	java: 'java',
	js: 'javascript',
	json: 'json',
	jsonc: 'json',
	jsx: 'javascript',
	kt: 'kotlin',
	kts: 'kotlin',
	less: 'less',
	lua: 'lua',
	makefile: 'makefile',
	markdown: 'markdown',
	md: 'markdown',
	mjs: 'javascript',
	mk: 'makefile',
	mts: 'typescript',
	nix: 'nix',
	patch: 'diff',
	php: 'php',
	pl: 'perl',
	pm: 'perl',
	proto: 'protobuf',
	py: 'python',
	pyi: 'python',
	r: 'r',
	rb: 'ruby',
	rs: 'rust',
	scala: 'scala',
	scss: 'scss',
	sh: 'bash',
	sql: 'sql',
	svg: 'xml',
	swift: 'swift',
	toml: 'ini',
	ts: 'typescript',
	tsx: 'typescript',
	vim: 'vim',
	xml: 'xml',
	yaml: 'yaml',
	yml: 'yaml',
	zsh: 'bash',
};

const FILENAME_TO_LANG: Record<string, LanguageName> = {
	dockerfile: 'dockerfile',
	gemfile: 'ruby',
	makefile: 'makefile',
	rakefile: 'ruby',
	vimrc: 'vim',
};

const INTERPRETER_TO_LANG: Record<string, LanguageName> = {
	bash: 'bash',
	dash: 'bash',
	deno: 'typescript',
	node: 'javascript',
	perl: 'perl',
	php: 'php',
	python: 'python',
	python2: 'python',
	python3: 'python',
	ruby: 'ruby',
	sh: 'bash',
	zsh: 'bash',
};

// support direct interpreters and env options.
const SHEBANG_RE = /^#!(?:\S*\/)?(?:env\s+(?:-\S+\s+)*)?([\w.-]+)/;

/**
 * detects a language from a filename or shebang.
 *
 * @param filename filename to inspect
 * @param contents source to inspect
 * @returns the grammar name, if detected
 */
export function detectLanguage({
	contents,
	filename,
}: {
	contents: string;
	filename: string | undefined;
}): LanguageName | undefined {
	if (filename) {
		const name = filename.toLowerCase();
		const whole = FILENAME_TO_LANG[name.replace(/^\./, '')];
		if (whole) {
			return whole;
		}

		const dot = name.lastIndexOf('.');
		const ext = dot > 0 ? EXT_TO_LANG[name.slice(dot + 1)] : undefined;
		if (ext) {
			return ext;
		}
	}

	const interpreter = SHEBANG_RE.exec(contents)?.[1];
	return interpreter ? INTERPRETER_TO_LANG[interpreter.toLowerCase()] : undefined;
}
