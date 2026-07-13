import { sanitizeDisplayName } from '#/lib/strings/display-names';

export function getUserDisplayName(props: { displayName?: string; handle: string }): string {
	return sanitizeDisplayName(props.displayName || `@${props.handle}`);
}
