import * as v from 'valibot';

import type { AiWireAdapter } from './format';
import { toOpenaiChatMessages } from './openai-messages';

const completionSchema = v.object({
	choices: v.array(
		v.object({
			message: v.object({
				content: v.optional(v.nullable(v.string())),
			}),
		}),
	),
});

export const openaiChatAdapter: AiWireAdapter = {
	buildBody({ maxTokens, messages, model, responseSchema, temperature }) {
		return {
			max_tokens: maxTokens,
			messages: toOpenaiChatMessages(messages),
			model: model,
			response_format: {
				type: 'json_schema',
				json_schema: { ...responseSchema, strict: true },
			},
			temperature: temperature,
		};
	},
	readReply(body) {
		const parsed = v.safeParse(completionSchema, body);
		if (!parsed.success) {
			return undefined;
		}
		return parsed.output.choices[0]?.message.content ?? '';
	},
};
