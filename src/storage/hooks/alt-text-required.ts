import { device, useStorage } from '#/storage';

export function useRequireAltTextEnabled() {
	const [requireAltTextEnabled = false, setRequireAltTextEnabled] = useStorage(device, [
		'requireAltTextEnabled',
	]);

	return [requireAltTextEnabled, setRequireAltTextEnabled] as const;
}
