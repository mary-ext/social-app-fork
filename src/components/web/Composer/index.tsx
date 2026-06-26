import {
	type CSSProperties,
	type Ref,
	useEffect,
	useEffectEvent,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';
import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';

import type { Placement } from '#/lib/sift';

import type { AutocompleteItem } from '#/components/Autocomplete/types';
import { useAutocomplete } from '#/components/Autocomplete/useAutocomplete';
import { parseAutocompleteItemType } from '#/components/Autocomplete/util';

import { fontSize, lineHeight } from '#/styles/tokens.css';

import { Autocomplete } from './Autocomplete';
import * as styles from './Composer.css';
import { type Completion, buildSpans, findCompletion, rangeFromOffsets } from './rich-text';

export type SubmitRequest = {
	platform: 'web';
	shiftKey: boolean;
	metaKey: boolean;
	nativeEvent: KeyboardEvent;
};

/** Padding shared by the textarea and the preview overlay so their glyphs line up. */
export type ContentPadding = {
	bottom: number;
	left: number;
	right: number;
	top: number;
};

/**
 * Imperative API exposed via `internalApiRef` for parents that drive the composer programmatically (clear,
 * insert at cursor).
 */
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
	minRows?: number;
	contentPadding?: ContentPadding;
	/** Layout for the editor box within its row (the consumer owns positioning). */
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

/** Web-native rich composer input with inline autocomplete for mentions, hashtags, and emoji. */
export function Composer({
	placeholder,
	defaultValue,
	autoFocus,
	minRows = 2,
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
	// the collapsed-selection caret drives completion detection; a range selection has no active completion.
	const [selection, setSelection] = useState(() => {
		const end = defaultValue?.length ?? 0;
		return { start: end, end };
	});
	// the completion the user explicitly dismissed (Escape/blur); cleared implicitly when the active
	// completion's identity changes (moving the caret elsewhere, or typing — which grows the query).
	const [dismissedCompletion, setDismissedCompletion] = useState<string | null>(null);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);

	const spans = buildSpans(text);
	const completion = selection.start === selection.end ? findCompletion(text, selection.end) : null;
	// require at least one character after the trigger (`@m`, not a bare `@`) before querying/opening.
	const hasQuery = !!completion && completion.query.length > 0;
	// the query is part of the identity so a dismissal doesn't outlive an edit: dismissing on `@alic`
	// must not suppress the popup when the caret later re-enters the committed `@alice.bsky.social`.
	const completionKey = completion
		? `${completion.type}:${completion.range.start}:${completion.query}`
		: null;

	const { isFetching, items } = useAutocomplete({
		type: completion ? parseAutocompleteItemType(completion.type) : 'profile',
		query: hasQuery ? completion.query : '',
	});
	// keep the popup open while results load so the spinner has somewhere to show.
	const autocompleteOpen =
		hasQuery && completionKey !== dismissedCompletion && (items.length > 0 || isFetching);

	const syncSelection = (el: HTMLInputElement | HTMLTextAreaElement) => {
		setSelection({ start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 });
	};

	// splice the picked suggestion over the completion range via execCommand so it joins the native undo stack.
	const selectItem = (item: AutocompleteItem) => {
		const el = textareaRef.current;
		if (!completion || !el) {
			return;
		}
		// reuse a space already after the completion rather than adding a second one.
		const spaceFollows = text[completion.range.end] === ' ';
		el.focus();
		el.setSelectionRange(completion.range.start, completion.range.end);
		document.execCommand('insertText', false, spaceFollows ? item.value : item.value + ' ');
		if (spaceFollows) {
			// step the caret over the reused space so the next keystroke lands after it.
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
				document.execCommand('insertText', false, str);
			},
		}),
		[],
	);

	// fire onChange after mount (parent already knows the initial value).
	const emitChange = useEffectEvent(onChange);
	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		emitChange(text);
	}, [text]);

	// notify the consumer as the active completion changes.
	const emitCompletion = useEffectEvent(onActiveCompletion);
	useEffect(() => {
		emitCompletion(completion);
	}, [completion]);

	const isComposing = useRef(false);

	const paddingStyle: CSSProperties = {
		paddingBottom: contentPadding.bottom,
		paddingLeft: contentPadding.left,
		paddingRight: contentPadding.right,
		paddingTop: contentPadding.top,
	};
	const minHeight = `calc(${lineHeight.snug} * ${fontSize.lg} * ${minRows} + ${
		contentPadding.top + contentPadding.bottom
	}px)`;

	return (
		<BaseAutocomplete.Root
			autoHighlight
			items={items}
			// the textarea holds the whole post; the completion substring is the query, so Base UI must not
			// filter or rewrite the value — we drive both ourselves.
			mode="none"
			open={autocompleteOpen}
			onOpenChange={(open, details) => {
				// only a deliberate dismissal should stick; picking a row or arrow-keying through the list
				// also closes the popup, but must not suppress it from reappearing on the same completion.
				if (!open && (details.reason === 'escape-key' || details.reason === 'outside-press')) {
					setDismissedCompletion(completionKey);
				}
			}}
			openOnInputClick={false}
			value={text}
			onValueChange={(value, details) => {
				// route the user's own edits (typing, paste, clear) into our state; ignore value changes Base
				// UI emits from picking a row (`item-press`), which we handle via the item's onClick to splice
				// into the completion instead.
				if (details.reason === 'input-change' || details.reason === 'input-clear') {
					setText(value);
					const el = textareaRef.current;
					if (el) {
						syncSelection(el);
					}
				}
			}}
		>
			<div className={clsx(styles.root, className)}>
				<div className={styles.overlay} aria-hidden inert>
					<div className={styles.overlayInner} ref={overlayRef} style={paddingStyle}>
						{spans.map((span, i) => (
							<span key={i} className={span.facet ? styles.facet : undefined}>
								{span.raw}
							</span>
						))}
					</div>
				</div>
				<BaseAutocomplete.Input
					// `rows` is textarea-only, so it rides on the render element, not the input-typed props.
					render={<textarea rows={1} />}
					// Base UI types Input for `<input>`; we render a `<textarea>`, so the ref is really a textarea.
					ref={textareaRef as unknown as Ref<HTMLInputElement>}
					className={styles.textarea}
					style={{ ...paddingStyle, minHeight }}
					placeholder={placeholder}
					aria-label={accessibilityLabel}
					aria-description={accessibilityHint}
					autoFocus={autoFocus}
					onSelect={(e) => syncSelection(e.currentTarget)}
					onKeyDown={(e) => {
						if (isComposing.current) {
							return;
						}
						// Safari fires a final IME-commit "Enter" with keyCode 229; ignore it.
						if (e.key === 'Enter' && e.keyCode === 229) {
							return;
						}
						// when the popup is open, Base UI consumes Enter to pick the highlighted row.
						if (e.key === 'Enter' && !e.defaultPrevented) {
							onRequestSubmit?.({
								platform: 'web',
								shiftKey: e.shiftKey,
								metaKey: e.metaKey,
								nativeEvent: e.nativeEvent,
							});
						}
					}}
					onPaste={(e) => onPaste?.(e.nativeEvent)}
					onFocus={onFocus}
					onBlur={() => {
						onBlur?.();
						setDismissedCompletion(completionKey);
					}}
					onCompositionStart={() => {
						isComposing.current = true;
					}}
					onCompositionEnd={() => {
						isComposing.current = false;
					}}
				/>
			</div>
			{autocompleteOpen && (
				<Autocomplete
					items={items}
					getAnchor={() => {
						const root = overlayRef.current;
						if (!root || !completion) {
							return null;
						}
						const range = rangeFromOffsets(root, completion.range.start, completion.range.end);
						return range && { getBoundingClientRect: () => range.getBoundingClientRect() };
					}}
					placement={autocompletePlacement}
					onSelect={selectItem}
				/>
			)}
		</BaseAutocomplete.Root>
	);
}
