export const FALLBACK_ANDROID = 'Android';
export const FALLBACK_IOS = 'iOS';
export const FALLBACK_WEB = 'Web';

export function getDeviceName(): string {
	return FALLBACK_WEB; // could append browser info here
}
