// scaffold: hardcodes useFonts to [true, null]. delete once src/alf/util/unusedUseFonts.ts is
// removed (web loads fonts via CSS, not expo-font).

export function useFonts(_fonts?: Record<string, unknown>): [boolean, Error | null] {
	return [true, null];
}
