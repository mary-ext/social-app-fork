import { type Ref, useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from 'react';

import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import type { AutocompleteItem, Placement } from '#/components/Composer/Autocomplete/types';
import { useAutocomplete } from '#/components/Composer/Autocomplete/useAutocomplete';
import { parseAutocompleteItemType } from '#/components/Composer/Autocomplete/util';

import { Autocomplete } from './Autocomplete';
import * as styles from './Composer.css';
import { type Completion, buildSpans, findCompletion, rangeFromOffsets } from './rich-text';

export type SubmitRequest = {
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

/** composer controls exposed through `internalApiRef`. */
export type ComposerInternalApi = {
	input?: {
		element: HTMLTextAreaElement | null;
		focus: () => void;
		blur: () => void;
	};
	clear: () => void;
	insert: (text: string) => void;
};

export function useComposerInternalApiRef() {
	return useRef<ComposerInternalApi>(null);
}

export type ComposerProps = {
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
	internalApiRef?: Ref<ComposerInternalApi>;
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

export function Composer({
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
}: ComposerProps) {
	const [text, setText] = useState(defaultValue ?? '');

	// Base UI defers value changes during IME composition.
	const [composingText, setComposingText] = useState<string | null>(null);
	const [selection, setSelection] = useState(() => {
		const end = defaultValue?.length ?? 0;
		return { start: end, end };
	});

	// suppress only the dismissed completion.
	const [dismissedCompletion, setDismissedCompletion] = useState<string | null>(null);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);

	const spans = buildSpans(composingText ?? text);
	const completion = selection.start === selection.end ? findCompletion(text, selection.end) : null;
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

	// overlay text nodes change on each edit.
	const anchor = completion &&
		overlay && {
			contextElement: overlay,
			getBoundingClientRect: () => {
				const range = rangeFromOffsets(overlay, completion.range.start, completion.range.end);
				return (range ?? overlay).getBoundingClientRect();
			},
		};

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
				setComposingText(null);
				setSelection({ start: 0, end: 0 });
			},
			insert: (str: string) => {
				const el = textareaRef.current;
				if (!el) {
					return;
				}
				el.focus();
				document.execCommand('insertText', false, str);
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

	// Composer.css calculates dimensions from these values.
	const layoutVars = assignInlineVars({
		[styles.minRowsVar]: String(minRows),
		[styles.paddingBottomVar]: `${contentPadding.bottom}px`,
		[styles.paddingLeftVar]: `${contentPadding.left}px`,
		[styles.paddingRightVar]: `${contentPadding.right}px`,
		[styles.paddingTopVar]: `${contentPadding.top}px`,
		...(maxRows !== undefined ? { [styles.maxRowsVar]: String(maxRows) } : {}),
	});

	return (
		<BaseAutocomplete.Root
			autoHighlight
			items={items}
			// the composer owns filtering and value updates.
			mode="none"
			open={autocompleteOpen}
			onOpenChange={(open, details) => {
				// selection can also close the popup, but is not a dismissal.
				if (!open && (details.reason === 'escape-key' || details.reason === 'outside-press')) {
					setDismissedCompletion(completionKey);
				}
			}}
			openOnInputClick={false}
			value={text}
			onValueChange={(value, details) => {
				// selectItem handles item presses.
				if (details.reason === 'input-change' || details.reason === 'input-clear') {
					setText(value);
					const el = textareaRef.current;
					if (el) {
						syncSelection(el);
					}
				}
			}}
		>
			<div
				className={clsx(styles.root({ fontSize }), maxRows !== undefined && styles.capped, className)}
				style={layoutVars}
			>
				<div className={styles.overlay} ref={setOverlay} aria-hidden inert>
					{spans.map((span, i) => (
						// oxlint-disable-next-line react/no-array-index-key -- positional overlay
						<span key={i} className={span.facet ? styles.facet : undefined}>
							{span.raw}
						</span>
					))}
				</div>
				<BaseAutocomplete.Input
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
					onChange={(e) => {
						if (isComposing.current) {
							setComposingText(e.currentTarget.value);
						}
					}}
					onKeyDown={(e) => {
						if (isComposing.current) {
							// Base UI handles Home and End before its IME guard.
							e.preventBaseUIHandler();

							return;
						}

						// preserve native textarea navigation when the list does not need the key.
						switch (e.key) {
							case 'End':
							case 'Home': {
								e.preventBaseUIHandler();

								break;
							}

							case 'ArrowDown':
							case 'ArrowUp': {
								if (!hasNavigableAutocomplete) {
									e.preventBaseUIHandler();
								}

								break;
							}

							case 'Enter': {
								// Safari reports IME commit as Enter with keyCode 229.
								if (e.keyCode === 229) {
									return;
								}

								// this handler runs before Base UI consumes Enter for selection.
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
					onBlur={() => {
						onBlur?.();
						setDismissedCompletion(completionKey);
					}}
					onCompositionStart={(e) => {
						isComposing.current = true;
						setComposingText(e.currentTarget.value);
					}}
					onCompositionEnd={() => {
						isComposing.current = false;
						setComposingText(null);
					}}
				/>
			</div>

			{autocompleteOpen && (
				<Autocomplete anchor={anchor} items={items} placement={autocompletePlacement} onSelect={selectItem} />
			)}
		</BaseAutocomplete.Root>
	);
}
