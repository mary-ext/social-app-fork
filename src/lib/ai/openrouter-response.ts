import * as v from 'valibot';

export const openRouterErrorSchema = v.object({
	error: v.object({
		message: v.optional(v.string()),
	}),
});
