import * as v from 'valibot';

import type { ChatContentPart } from '../chat';
import type { AiWireAdapter } from './format';

// Anthropic structured output uses a forced tool call.
const OUTPUT_TOOL_NAME = 'submit_output';

const messageSchema = v.object({
	content: v.array(
		v.object({
			input: v.optional(v.unknown()),
			name: v.optional(v.string()),
			text: v.optional(v.string()),
			type: v.string(),
		}),
	),
});

type AnthropicBlock = { type: 'image'; source: ImageSource } | { type: 'text'; text: string };

type ImageSource = { type: 'base64'; data: string; media_type: string };

export const anthropicAdapter: AiWireAdapter = {
	buildBody({ maxTokens, messages, model, responseSchema, temperature }) {
		const system: string[] = [];
		const conversation: { role: 'assistant' | 'user'; content: AnthropicBlock[] }[] = [];

		// system prompts are separate from the conversation.
		for (const message of messages) {
			if (message.role === 'system') {
				system.push(message.content);
			} else {
				conversation.push({ role: message.role, content: toBlocks(message.content) });
			}
		}

		return {
			max_tokens: maxTokens,
			messages: conversation,
			model: model,
			system: system.length > 0 ? system.join('\n\n') : undefined,
			temperature: temperature,
			tool_choice: { type: 'tool', name: OUTPUT_TOOL_NAME },
			tools: [
				{
					name: OUTPUT_TOOL_NAME,
					description: 'submit the final answer',
					input_schema: responseSchema.schema,
				},
			],
		};
	},
	readReply(body) {
		const parsed = v.safeParse(messageSchema, body);
		if (!parsed.success) {
			return undefined;
		}

		const call = parsed.output.content.find((block) => {
			return block.type === 'tool_use' && block.name === OUTPUT_TOOL_NAME;
		});
		// missing input triggers the caller's retry.
		if (call?.input !== undefined) {
			return JSON.stringify(call.input);
		}

		// fall back to text when tool choice is ignored.
		return parsed.output.content
			.filter((block) => block.type === 'text')
			.map((block) => block.text ?? '')
			.join('');
	},
};

const toBlocks = (content: ChatContentPart[] | string): AnthropicBlock[] => {
	if (typeof content === 'string') {
		return [{ type: 'text', text: content }];
	}
	return content.map(toBlock);
};

const toBlock = (part: ChatContentPart): AnthropicBlock => {
	switch (part.type) {
		case 'image': {
			return { type: 'image', source: { type: 'base64', data: part.data, media_type: part.mimeType } };
		}
		case 'text': {
			return { type: 'text', text: part.text };
		}
	}
};
