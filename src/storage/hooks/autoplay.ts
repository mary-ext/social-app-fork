import { PlatformInfo } from '#/shims/bluesky-swiss-army';
import { device, useStorage } from '#/storage';

export function useAutoplayDisabled() {
	const [disableAutoplay = PlatformInfo.getIsReducedMotionEnabled(), setAutoplayDisabled] = useStorage(
		device,
		['disableAutoplay'],
	);

	return [disableAutoplay, setAutoplayDisabled] as const;
}
