import { z } from 'zod';

import { logger } from '#/logger';

const schema = z.object({
	reminders: z.object({
		lastEmailConfirm: z.string().optional(),
	}),
	invites: z.object({
		copiedInvites: z.array(z.string()),
	}),
});
export type Schema = z.infer<typeof schema>;

export const defaults: Schema = {
	reminders: {
		lastEmailConfirm: undefined,
	},
	invites: {
		copiedInvites: [],
	},
};

export function tryParse(rawData: string): Schema | undefined {
	let objData;
	try {
		objData = JSON.parse(rawData);
	} catch (e) {
		logger.error('persisted state: failed to parse root state from storage', {
			message: e,
		});
	}
	if (!objData) {
		return undefined;
	}
	const parsed = schema.safeParse(objData);
	if (parsed.success) {
		return objData;
	} else {
		const errors =
			parsed.error?.errors?.map((e) => ({
				code: e.code,
				// @ts-ignore exists on some types
				expected: e?.expected,
				path: e.path?.join('.'),
			})) || [];
		logger.error(`persisted store: data failed validation on read`, { errors });
		return undefined;
	}
}

export function tryStringify(value: Schema): string | undefined {
	try {
		schema.parse(value);
		return JSON.stringify(value);
	} catch (e) {
		logger.error(`persisted state: failed stringifying root state`, {
			message: e,
		});
		return undefined;
	}
}
