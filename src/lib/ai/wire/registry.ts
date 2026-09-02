import type { AiWireFormat } from '../../lexicons';
import { anthropicAdapter } from './anthropic';
import type { AiWireAdapter } from './format';
import { openaiChatAdapter } from './openai-chat';
import { openaiResponsesAdapter } from './openai-responses';

export const AI_WIRE_ADAPTERS: Record<AiWireFormat, AiWireAdapter> = {
	anthropic_messages: anthropicAdapter,
	openai_chat_completions: openaiChatAdapter,
	openai_responses: openaiResponsesAdapter,
};
