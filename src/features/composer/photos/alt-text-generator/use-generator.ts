import { useEffect, useReducer, useRef } from 'react';

import { ClientResponseError } from '@atcute/client';

import { OpenRouterError } from '#/lib/ai/openrouter-error';

import { m } from '#/paraglide/messages';

import { generateAltText, prepareAltTextImage } from './api';
import type { AltTextContext, AltTextImage, AltTextQuestion, AltTextRound } from './types';

/**
 * `idle` before the first run, `thinking` while a round is in flight, `review` once a draft has been applied
 * (with or without follow-up questions), `error` when a round failed.
 */
export type GeneratorPhase = 'error' | 'idle' | 'review' | 'thinking';

type GeneratorState = {
	error: string | null;
	phase: GeneratorPhase;
	/**
	 * Every round so far, oldest first. The last one holds the draft and questions on screen, and collects
	 * answers as they're typed until the next round folds them into the conversation.
	 */
	rounds: AltTextRound[];
};

type GeneratorAction =
	| { type: 'answer'; answer: string; question: string }
	| { type: 'cancel' }
	| { type: 'context'; text: string }
	| { type: 'reject'; message: string }
	| { type: 'reset' }
	| { type: 'resolve'; rounds: AltTextRound[] }
	| { type: 'start' };

const INITIAL: GeneratorState = {
	error: null,
	phase: 'idle',
	rounds: [],
};

const reducer = (state: GeneratorState, action: GeneratorAction): GeneratorState => {
	switch (action.type) {
		case 'answer': {
			const last = state.rounds.at(-1);
			if (last === undefined) {
				return state;
			}

			return {
				...state,
				rounds: [
					...state.rounds.slice(0, -1),
					{
						...last,
						questions: last.questions.map((entry) =>
							entry.question === action.question
								? { answer: action.answer, question: entry.question }
								: entry,
						),
					},
				],
			};
		}
		case 'cancel': {
			// the conversation is only ever extended on a completed round, so there's nothing to unwind
			return { ...state, error: null, phase: state.rounds.length === 0 ? 'idle' : 'review' };
		}
		case 'context': {
			const last = state.rounds.at(-1);
			if (last === undefined) {
				return state;
			}

			return {
				...state,
				rounds: [...state.rounds.slice(0, -1), { ...last, additionalContext: action.text }],
			};
		}
		case 'reject': {
			return { ...state, error: action.message, phase: 'error' };
		}
		case 'reset': {
			return INITIAL;
		}
		case 'resolve': {
			return { ...state, error: null, phase: 'review', rounds: action.rounds };
		}
		case 'start': {
			return { ...state, error: null, phase: 'thinking' };
		}
	}
};

type Options = {
	/** The image bytes to describe — the composer's transformed blob when there is one. */
	blob: Blob;
	/** The post the image is being attached to; read fresh on every round, so edits in between count. */
	context: AltTextContext;
	/** Called with each finished draft; the caller owns the alt text and decides how to apply it. */
	onGenerated: (draft: string) => void;
	/** The alt text as it currently reads in the field, so a rewrite of the last draft can be fed back. */
	text: string;
};

export type Generator = {
	/** Whatever has been typed into the free-form field; empty before the first round. */
	additionalContext: string;
	/**
	 * How many of the fields currently on screen hold something — the model's questions plus the free-form one,
	 * which is always among them.
	 */
	answeredCount: number;
	/** Abandon the in-flight round, keeping answers. */
	cancel: () => void;
	/** Collapse back to the pre-generation state, dropping the conversation. */
	dismiss: () => void;
	/** The most recent draft, or `null` before the first round. */
	draft: string | null;
	error: string | null;
	/** Run a round, folding in whatever has been answered or rewritten since the last one. */
	generate: () => void;
	/** Whether the field has been rewritten away from the latest draft, so the next round will carry it. */
	hasEdits: boolean;
	phase: GeneratorPhase;
	/** Questions from the latest round with whatever has been typed against them; empty before the first. */
	questions: AltTextQuestion[];
	setAdditionalContext: (text: string) => void;
	setAnswer: (question: string, answer: string) => void;
};

/**
 * Drives alt text generation as a conversation: run, answer the model's clarifying questions or rewrite the
 * draft yourself, run again with both folded in. Every completed round hands its draft to `onGenerated`.
 *
 * @param options the image to describe, the post around it, the field's current text, and where drafts go
 */
export const useAltTextGenerator = ({ blob, context, onGenerated, text }: Options): Generator => {
	const [state, dispatch] = useReducer(reducer, INITIAL);
	const abortRef = useRef<AbortController | null>(null);
	const imageRef = useRef<{ blob: Blob; encoded: Promise<AltTextImage> } | null>(null);

	useEffect(() => {
		return () => abortRef.current?.abort();
	}, []);

	const current = state.rounds.at(-1);
	const questions = current?.questions ?? [];
	const draft = current?.draft ?? null;
	const additionalContext = current?.additionalContext ?? '';

	// an emptied field reads as starting over rather than as a rewrite, so there's nothing to feed back
	const hasEdits = draft !== null && text.trim() !== '' && text.trim() !== draft.trim();

	const abort = () => {
		abortRef.current?.abort();
		abortRef.current = null;
	};

	// every round describes the same bytes, so the encode is shared. keyed on the blob because cropping the
	// image swaps it underneath us, and dropped on failure so the retry button isn't handed the same rejection
	const loadImage = () => {
		if (imageRef.current?.blob !== blob) {
			const encoded = prepareAltTextImage(blob).catch((error: unknown) => {
				if (imageRef.current?.blob === blob) {
					imageRef.current = null;
				}
				throw error;
			});

			imageRef.current = { blob, encoded };
		}

		return imageRef.current.encoded;
	};

	// only ever called from an event handler, so the closed-over state is the one the user is looking at
	const generate = () => {
		abort();

		const controller = new AbortController();
		abortRef.current = controller;

		dispatch({ type: 'start' });

		void (async () => {
			try {
				const image = await loadImage();
				const rounds = sealLastRound(state.rounds, hasEdits ? text.trim() : undefined);
				const result = await generateAltText({ context, image, rounds, signal: controller.signal });

				if (controller.signal.aborted) {
					return;
				}

				onGenerated(result.draft);
				dispatch({
					type: 'resolve',
					rounds: [
						...rounds,
						{ draft: result.draft, questions: result.questions.map((question) => ({ question })) },
					],
				});
			} catch (error: unknown) {
				if (controller.signal.aborted) {
					return;
				}

				// the panel shows a single short line, so keep the cause reachable for debugging
				console.error('alt text generation failed:', error);
				dispatch({ type: 'reject', message: describeFailure(error) });
			}
		})();
	};

	return {
		additionalContext,
		answeredCount:
			questions.filter(({ answer }) => (answer ?? '').trim() !== '').length +
			(additionalContext.trim() === '' ? 0 : 1),
		cancel: () => {
			abort();
			dispatch({ type: 'cancel' });
		},
		dismiss: () => {
			abort();
			dispatch({ type: 'reset' });
		},
		draft,
		error: state.error,
		generate,
		hasEdits,
		phase: state.phase,
		questions,
		// `text` is already the alt text field's contents in this scope, so the parameter goes by another name
		setAdditionalContext: (next) => dispatch({ type: 'context', text: next }),
		setAnswer: (question, answer) => dispatch({ type: 'answer', answer, question }),
	};
};

const describeFailure = (error: unknown): string => {
	if (error instanceof OpenRouterError) {
		switch (error.status) {
			case 401:
			case 403: {
				return m['view.composer.altText.generate.error.openRouterKey']();
			}
			case 402: {
				return m['view.composer.altText.generate.error.openRouterCredits']();
			}
			case 429: {
				return m['view.composer.altText.generate.error.openRouterRateLimited']();
			}
			default: {
				return m['view.composer.altText.generate.error.openRouterUnavailable']();
			}
		}
	}

	// our own endpoint meters each account, and the PDS relays the 429 as-is on its way back through the
	// proxy. it is worth telling apart from an outage: waiting fixes one and not the other
	if (error instanceof ClientResponseError && error.status === 429) {
		return m['view.composer.altText.generate.error.rateLimited']();
	}

	return m['view.composer.altText.generate.error.unavailable']();
};

const sealLastRound = (rounds: AltTextRound[], edited: string | undefined): AltTextRound[] => {
	const last = rounds.at(-1);
	if (last === undefined) {
		return [];
	}

	const extra = last.additionalContext?.trim();

	return [
		...rounds.slice(0, -1),
		{
			additionalContext: extra === undefined || extra === '' ? undefined : extra,
			draft: last.draft,
			edited: edited,
			questions: last.questions.map(({ answer, question }) => {
				const trimmed = answer?.trim();
				return trimmed === undefined || trimmed === '' ? { question } : { answer: trimmed, question };
			}),
		},
	];
};
