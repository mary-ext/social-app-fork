import { type Ref, useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import {
	buildSpans,
	type Completion,
	findCompletion,
	splitSpans,
	type TextSpan,
} from '#/lib/rich-text-input';

import {
	type AutocompleteItem,
	parseAutocompleteItemType,
	useAutocomplete,
} from '#/state/queries/autocomplete';

import * as Autocomplete from '#/components/primitives/autocomplete';

import * as styles from './MessageInput.css';
import { MessageInputAutocomplete, type Placement } from './MessageInputAutocomplete';

type SubmitRequest = {
	platform: 'web';
	shiftKey: boolean;
	metaKey: boolean;
	nativeEvent: KeyboardEvent;
};

/** shared textarea and overlay padding. */
export type ContentPadding = {
	bottom: number;
	left: number;
	right: number;
	top: number;
};

/** input controls exposed through `internalApiRef`. */
export type MessageInputApi = {
	input?: {
		element: HTMLTextAreaElement | null;
		focus: () => void;
		blur: () => void;
	};
	clear: () => void;
	insert: (text: string) => void;
};

export function useMessageInputApiRef() {
	return useRef<MessageInputApi>(null);
}

export type MessageInputProps = {
	placeholder?: string;
	defaultValue?: string;
	autoFocus?: boolean;
	disabled?: boolean;
	/** shared textarea and overlay font size. */
	fontSize?: 'lg' | 'md';
	minRows?: number;
	/** row limit before scrolling. */
	maxRows?: number;
	contentPadding?: ContentPadding;
	className?: string;
	autocompletePlacement?: Placement;
	internalApiRef?: Ref<MessageInputApi>;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	onChange?: (text: string) => void;
	onActiveCompletion?: (completion: Completion | null) => void;
	onPaste?: (event: ClipboardEvent) => void;
	onRequestSubmit?: (request: SubmitRequest) => void;
	onFocus?: () => void;
	onBlur?: () => void;
};

const NO_PADDING: ContentPadding = { bottom: 0, left: 0, right: 0, top: 0 };

const noop = () => {};

export function MessageInput({
	placeholder,
	defaultValue,
	autoFocus,
	disabled,
	fontSize = 'lg',
	minRows = 2,
	maxRows,
	contentPadding = NO_PADDING,
	className,
	autocompletePlacement,
	internalApiRef,
	accessibilityLabel,
	accessibilityHint,
	onChange = noop,
	onActiveCompletion = noop,
	onPaste,
	onRequestSubmit,
	onFocus,
	onBlur,
}: MessageInputProps) {
	const [text, setText] = useState(defaultValue ?? '');

	const [selection, setSelection] = useState(() => {
		const end = defaultValue?.length ?? 0;
		return { start: end, end };
	});

	// suppress only the dismissed completion.
	const [dismissedCompletion, setDismissedCompletion] = useState<string | null>(null);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [anchor, setAnchor] = useState<HTMLSpanElement | null>(null);

	const completion = selection.start === selection.end ? findCompletion(text, selection.end) : null;
	const spans = splitSpans(buildSpans(text), completion?.range);
	const hasQuery = !!completion && completion.query.length > 0;

	// include the query so edits clear a dismissal.
	const completionKey = completion
		? `${completion.type}:${completion.range.start}:${completion.query}`
		: null;

	const { isFetching, items } = useAutocomplete({
		type: completion ? parseAutocompleteItemType(completion.type) : 'profile',
		query: hasQuery ? completion.query : '',
	});

	// open during fetch to show the spinner.
	const autocompleteOpen =
		hasQuery && completionKey !== dismissedCompletion && (items.length > 0 || isFetching);
	const hasNavigableAutocomplete = autocompleteOpen && items.length > 0;

	const syncSelection = (el: HTMLInputElement | HTMLTextAreaElement) => {
		setSelection({ start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 });
	};

	// execCommand preserves the native undo stack.
	const selectItem = (item: AutocompleteItem) => {
		const el = textareaRef.current;
		if (!completion || !el) {
			return;
		}
		const spaceFollows = text[completion.range.end] === ' ';
		el.focus();
		el.setSelectionRange(completion.range.start, completion.range.end);
		document.execCommand('insertText', false, spaceFollows ? item.value : item.value + ' ');
		if (spaceFollows) {
			const caret = completion.range.start + item.value.length + 1;
			el.setSelectionRange(caret, caret);
			syncSelection(el);
		}
	};

	useImperativeHandle(
		internalApiRef,
		() => ({
			input: {
				element: textareaRef.current,
				focus: () => textareaRef.current?.focus(),
				blur: () => textareaRef.current?.blur(),
			},
			clear: () => {
				setText('');
				setSelection({ start: 0, end: 0 });
			},
			insert: (str: string) => {
				const el = textareaRef.current;
				if (!el) {
					return;
				}
				el.focus();
				if (document.activeElement === el) {
					document.execCommand('insertText', false, str);
					return;
				}
				// modal popups can leave the textarea inert, preventing focused insertion.
				el.setRangeText(str, el.selectionStart, el.selectionEnd, 'end');
				el.dispatchEvent(new Event('input', { bubbles: true }));
			},
		}),
		[],
	);

	// the parent supplied the initial value.
	const emitChange = useEffectEvent(onChange);
	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		emitChange(text);
	}, [text]);

	const emitCompletion = useEffectEvent(onActiveCompletion);
	useEffect(() => {
		emitCompletion(completion);
	}, [completion]);

	const isComposing = useRef(false);

	const layoutVars = assignInlineVars({
		[styles.minRowsVar]: String(minRows),
		[styles.paddingBottomVar]: `${contentPadding.bottom}px`,
		[styles.paddingLeftVar]: `${contentPadding.left}px`,
		[styles.paddingRightVar]: `${contentPadding.right}px`,
		[styles.paddingTopVar]: `${contentPadding.top}px`,
		...(maxRows !== undefined ? { [styles.maxRowsVar]: String(maxRows) } : {}),
	});

	return (
		<Autocomplete.Root
			autoHighlight
			items={items}
			open={autocompleteOpen}
			onItemPress={selectItem}
			onOpenChange={(open) => {
				if (!open) {
					setDismissedCompletion(completionKey);
				}
			}}
			value={text}
			onValueChange={(value, details) => {
				setText(value);
				if (details.event.target instanceof HTMLTextAreaElement) {
					syncSelection(details.event.target);
				}
			}}
		>
			<div
				className={clsx(styles.root({ fontSize }), maxRows !== undefined && styles.capped, className)}
				style={layoutVars}
			>
				<div className={styles.overlay} aria-hidden inert>
					{renderSpans(spans.before)}
					{spans.inside.length > 0 && <span ref={setAnchor}>{renderSpans(spans.inside)}</span>}
					{renderSpans(spans.after)}
				</div>
				<Autocomplete.Input
					render={<textarea rows={1} ref={textareaRef} />}
					className={styles.textarea}
					placeholder={placeholder}
					disabled={disabled}
					aria-label={accessibilityLabel}
					aria-description={accessibilityHint}
					autoFocus={autoFocus}
					// composition offsets do not match committed text.
					onSelect={(e) => {
						if (!isComposing.current) {
							syncSelection(e.currentTarget);
						}
					}}
					onKeyDown={(e) => {
						if (isComposing.current) {
							return;
						}

						// preserve native textarea navigation when the list does not need the key.
						switch (e.key) {
							case 'ArrowDown':
							case 'ArrowUp': {
								if (!hasNavigableAutocomplete) {
									e.preventPrimitiveHandler();
								}

								break;
							}

							case 'Enter': {
								// Safari reports IME commit as Enter with keyCode 229.
								if (e.keyCode === 229) {
									return;
								}

								if (!hasNavigableAutocomplete) {
									onRequestSubmit?.({
										platform: 'web',
										shiftKey: e.shiftKey,
										metaKey: e.metaKey,
										nativeEvent: e.nativeEvent,
									});
								}

								break;
							}
						}
					}}
					onPaste={(e) => onPaste?.(e.nativeEvent)}
					onFocus={onFocus}
					onBlur={onBlur}
					onCompositionStart={() => {
						isComposing.current = true;
					}}
					onCompositionEnd={() => {
						isComposing.current = false;
					}}
				/>
			</div>

			<MessageInputAutocomplete anchor={anchor} items={items} placement={autocompletePlacement} />
		</Autocomplete.Root>
	);
}

const renderSpans = (spans: TextSpan[]) => {
	return spans.map((span, i) => (
		// oxlint-disable-next-line react/no-array-index-key -- positional overlay
		<span key={i} className={span.facet ? styles.facet : undefined}>
			{span.raw}
		</span>
	));
};
