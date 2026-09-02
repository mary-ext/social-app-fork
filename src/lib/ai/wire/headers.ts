// shared with worker code; dependencies must remain type-only.
import type { AiWireFormat } from '../../lexicons';

export const AI_FORMAT_HEADERS: Record<AiWireFormat, Record<string, string>> = {
	anthropic_messages: {
		// permits browser requests carrying an API key.
		'anthropic-dangerous-direct-browser-access': 'true',
		'anthropic-version': '2023-06-01',
	},
	openai_chat_completions: {},
	openai_responses: {},
};
