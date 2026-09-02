import * as v from 'valibot';

export const aiErrorEnvelopeSchema = v.object({
	error: v.object({
		message: v.optional(v.string()),
	}),
});
