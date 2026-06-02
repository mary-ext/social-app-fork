type ClassValue = string | false | null | undefined;

/**
 * Joins truthy class name fragments with spaces. Small local helper so component files can compose a VE
 * `style()` class, `sprinkles(...)` output, and a passed-through `className` without a dependency.
 *
 * @param values class name fragments; falsy values are dropped
 * @returns the space-joined class string
 */
export const cx = (...values: ClassValue[]): string => values.filter(Boolean).join(' ');
