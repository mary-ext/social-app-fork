// This isn't a real property, but it prevents T being compatible with Shadow<T>.
declare const shadowTag: unique symbol;
export type Shadow<T> = T & { [shadowTag]: true };

export function castAsShadow<T>(value: T): Shadow<T> {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `shadowTag` is a phantom brand; this helper is the one place that applies it
	return value as Shadow<T>;
}
