/**
 * Strips whitespace, a leading `#`, and zero-width/soft-hyphen characters from a muted-word value.
 *
 * @param value the raw muted-word value.
 * @returns the sanitized value.
 */
export function sanitizeMutedWordValue(value: string): string {
	return (
		value
			.trim()
			.replace(/^#(?!️)/, '')
			// oxlint-disable-next-line no-misleading-character-class -- stripping the zero-width joiners is the point
			.replace(/[\r\n­⁠‍‌​]+/, '')
	);
}
