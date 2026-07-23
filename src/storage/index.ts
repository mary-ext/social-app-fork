import type { Account, Auth, Device } from '#/storage/schema';
import { Storage } from '#/storage/storage';

export * from '#/storage/schema';
export { useStorage } from '#/storage/use-storage';

/** device data specific to the device that does not vary based on account. */
export const device = new Storage<[], Device>({ id: 'bsky_device' });

/** account data specific to an account on this device. */
export const account = new Storage<[string], Account>({ id: 'bsky_account' });

/** OAuth-backed account list and active account pointer for this device. */
export const auth = new Storage<[], Auth>({ id: 'bsky_auth' });

if (import.meta.env.DEV && typeof window !== 'undefined') {
	// @ts-expect-error - dev global
	window.bsky_storage = {
		account,
		auth,
		device,
	};
}
