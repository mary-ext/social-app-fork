import { sanitizeDisplayName } from '#/lib/strings/display-names';

export function getUserDisplayName<T extends { displayName?: string; handle: string }>(props: T): string {
	return sanitizeDisplayName(props.displayName || `@${props.handle}`);
}
