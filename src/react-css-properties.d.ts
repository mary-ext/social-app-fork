declare module 'react' {
	interface CSSProperties {
		[property: `--${string}`]: number | string | undefined;
	}
}

// keep this a module to augment React's types rather than replace them.
// oxlint-disable-next-line unicorn/require-module-specifiers
export {};
