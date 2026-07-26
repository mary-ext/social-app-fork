import { device } from '#/storage';

/**
 * returns unique device ID, generating one if not stored.
 *
 * @returns unique device ID
 */
export function getDeviceId(): string {
	let id = device.get(['deviceId']);
	if (!id) {
		id = crypto.randomUUID();
		device.set(['deviceId'], id);
	}
	return id;
}
