// #region codec primitive

/**
 * a bidirectional codec for a single route parameter.
 *
 * returning `undefined` from `decode` signals validation failure, which causes the matcher to skip the
 * candidate route.
 */
export interface Codec<T> {
	/**
	 * parses a raw URL segment.
	 *
	 * @param raw the percent-decoded path segment or query value
	 * @returns the decoded value, or `undefined` if the segment is invalid
	 */
	decode(raw: string): T | undefined;
	/**
	 * serializes a value to a raw URL segment.
	 *
	 * @param value the value to serialize
	 * @returns the raw string value
	 */
	encode(value: T): string;
}

const OPTIONAL: unique symbol = Symbol('stacker.optional');
const DEFAULT: unique symbol = Symbol('stacker.default');

/** a codec whose parameter may be absent. */
export interface OptionalCodec<T> extends Codec<T> {
	readonly [OPTIONAL]: true;
}

/** a codec whose parameter has a default fallback. */
export interface DefaultedCodec<T> extends Codec<T> {
	readonly [DEFAULT]: T;
}

/** extracts the value type a codec decodes to. */
export type Infer<C> = C extends Codec<infer T> ? T : never;

// #endregion

// #region type-level param shapes

// `Codec<T>` is invariant, so the bound must use `any`; `const` generics preserve each exact codec type.
// oxlint-disable-next-line typescript/no-explicit-any -- invariance bound, see note above
export type CodecRecord = { readonly [name: string]: Codec<any> };

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type AnyOptional = { readonly [OPTIONAL]: true };
type AnyDefaulted = { readonly [DEFAULT]: unknown };

type OptionalKeys<P extends CodecRecord> = {
	[K in keyof P]: P[K] extends AnyOptional ? K : never;
}[keyof P];

type DefaultedKeys<P extends CodecRecord> = {
	[K in keyof P]: P[K] extends AnyDefaulted ? K : never;
}[keyof P];

export type DecodeShape<P extends CodecRecord> = Prettify<
	{ [K in Exclude<keyof P, OptionalKeys<P>>]: Infer<P[K]> } & { [K in OptionalKeys<P>]?: Infer<P[K]> }
>;

export type BuildShape<P extends CodecRecord> = Prettify<
	{ [K in Exclude<keyof P, DefaultedKeys<P> | OptionalKeys<P>>]: Infer<P[K]> } & {
		[K in DefaultedKeys<P> | OptionalKeys<P>]?: Infer<P[K]>;
	}
>;

// #endregion

// #region primitives

/**
 * creates a codec for a string segment.
 *
 * @returns the string codec
 */
export const string = (): Codec<string> => ({
	decode: (raw) => raw,
	encode: (value) => value,
});

/**
 * creates a codec for a safe integer.
 *
 * @returns the integer codec
 */
export const integer = (): Codec<number> => ({
	decode: (raw) => {
		// reject leading zeros, `-0`, a leading `+`, exponents, and decimals to ensure round-tripping.
		if (!/^(?:0|-[1-9]\d*|[1-9]\d*)$/.test(raw)) {
			return undefined;
		}
		const value = Number(raw);
		return Number.isSafeInteger(value) ? value : undefined;
	},
	encode: (value) => {
		if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
			throw new Error(`stacker: integer() cannot encode ${value}`);
		}
		return String(value);
	},
});

/**
 * creates a codec for a boolean value.
 *
 * @returns the boolean codec
 */
export const boolean = (): Codec<boolean> => ({
	decode: (raw) => {
		switch (raw) {
			case 'false': {
				return false;
			}
			case 'true': {
				return true;
			}
			default: {
				return undefined;
			}
		}
	},
	encode: (value) => (value ? 'true' : 'false'),
});

/**
 * creates a codec for a fixed set of string values.
 *
 * @param values the allowed string values
 * @returns the enum codec
 */
export const enumOf = <const V extends readonly string[]>(values: V): Codec<V[number]> => {
	const set: ReadonlySet<string> = new Set(values);
	return {
		decode: (raw) => (set.has(raw) ? raw : undefined),
		encode: (value) => value,
	};
};

/**
 * wraps a codec to allow its parameter to be absent.
 *
 * @param codec the inner codec
 * @returns the optional codec
 */
export const optional = <T>(codec: Codec<T>): OptionalCodec<T> => ({
	decode: (raw) => codec.decode(raw),
	encode: (value) => codec.encode(value),
	[OPTIONAL]: true,
});

/**
 * wraps a codec with a default value.
 *
 * @param codec the inner codec
 * @param fallback the default value
 * @returns the defaulted codec
 */
export const withDefault = <T>(codec: Codec<T>, fallback: T): DefaultedCodec<T> => ({
	decode: (raw) => codec.decode(raw),
	encode: (value) => codec.encode(value),
	[DEFAULT]: fallback,
});

// #endregion

// #region runtime reflection

export const isOptional = (codec: Codec<unknown>): codec is OptionalCodec<unknown> => {
	return OPTIONAL in codec;
};

export const getDefault = (codec: Codec<unknown>): readonly [unknown] | undefined => {
	return DEFAULT in codec ? [(codec as DefaultedCodec<unknown>)[DEFAULT]] : undefined;
};

// #endregion
