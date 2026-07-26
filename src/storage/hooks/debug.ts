import { device, useStorageValue } from '#/storage';

/** whether feed posts expose the feed context that surfaced them. */
export function useDebugFeedContextEnabled() {
	return useStorageValue(device, ['debugFeedContextEnabled']) ?? false;
}

export function setDebugFeedContextEnabled(value: boolean) {
	device.set(['debugFeedContextEnabled'], value);
}
