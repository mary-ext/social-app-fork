import type { DB } from '#/storage/archive/db/types';

export function create({ id }: { id: string }): DB {
	const prefix = `${id}:`;
	const scopedKey = (key: string) => `${prefix}${key}`;

	return {
		get(key: string) {
			try {
				return localStorage.getItem(scopedKey(key)) ?? undefined;
			} catch {
				return undefined;
			}
		},
		set(key: string, value: string) {
			try {
				localStorage.setItem(scopedKey(key), value);
			} catch {
				// Expected in restricted/private modes or quota exhaustion.
			}
		},
		delete(key: string) {
			try {
				localStorage.removeItem(scopedKey(key));
			} catch {
				// Expected in restricted/private modes.
			}
		},
		clear() {
			try {
				const keys: string[] = [];
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					if (key?.startsWith(prefix)) {
						keys.push(key);
					}
				}
				keys.forEach((key) => localStorage.removeItem(key));
			} catch {
				// Expected in restricted/private modes.
			}
		},
	};
}
