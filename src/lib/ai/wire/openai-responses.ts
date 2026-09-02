import * as v from 'valibot';

import { type ChatContentPart, type ChatMessage, toImageDataUrl } from '../chat';
import type { AiWireAdapter } from './format';

const outputSchema = v.object({
	output: v.array(
		v.object({
			content: v.optional(
				v.array(
					v.object({
						text: v.optional(v.string()),
						type: v.string(),
					}),
				),
			),
			type: v.string(),
		}),
	),
});

type OpenaiResponsesContentPart =
	| { type: 'input_image'; detail: 'auto'; image_url: string }
	| { type: 'input_text'; text: string };

type OpenaiResponsesInputItem =
	| { role: 'assistant'; content: string }
	| { role: 'system'; content: string }
	| { role: 'user'; content: OpenaiResponsesContentPart[] | string };

export const openaiResponsesAdapter: AiWireAdapter = {
	buildBody({ maxTokens, messages, model, responseSchema, temperature }) {
		return {
			input: messages.map(toInputItem),
			max_output_tokens: maxTokens,
			model: model,
			// prevent provider-side conversation storage.
			store: false,
			temperature: temperature,
			text: {
				format: {
					type: 'json_schema',
					name: responseSchema.name,
					schema: responseSchema.schema,
					strict: true,
				},
			},
		};
	},
	readReply(body) {
		const parsed = v.safeParse(outputSchema, body);
		if (!parsed.success) {
			return undefined;
		}

		let reply = '';
		for (const item of parsed.output.output) {
			if (item.type !== 'message') {
				continue;
			}
			for (const part of item.content ?? []) {
				if (part.type === 'output_text') {
					reply += part.text ?? '';
				}
			}
		}
		return reply;
	},
};

const toInputItem = (message: ChatMessage): OpenaiResponsesInputItem => {
	if (message.role !== 'user') {
		return message;
	}

	const { content } = message;
	return {
		role: 'user',
		content: typeof content === 'string' ? content : content.map(toContentPart),
	};
};

const toContentPart = (part: ChatContentPart): OpenaiResponsesContentPart => {
	switch (part.type) {
		case 'image': {
			return { type: 'input_image', detail: 'auto', image_url: toImageDataUrl(part) };
		}
		case 'text': {
			return { type: 'input_text', text: part.text };
		}
	}
};
