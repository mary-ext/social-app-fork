import { device } from '#/storage';

export function getDeviceId(): string {
	let id = device.get(['deviceId']);
	if (!id) {
		id = crypto.randomUUID();
		device.set(['deviceId'], id);
	}
	return id;
}
