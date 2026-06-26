import {
	type CSSProperties,
	type Ref,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import { clsx } from 'clsx';

import { mergeRefs } from '#/lib/merge-refs';
import type { Placement } from '#/lib/sift';
import { type TapperActiveFacet, type TapperFacet, useTapper } from '#/lib/tapper';

import type { AutocompleteItem } from '#/components/Autocomplete/types';
import { useAutocomplete } from '#/components/Autocomplete/useAutocomplete';
import { parseAutocompleteItemType } from '#/components/Autocomplete/util';

import { fontSize, lineHeight } from '#/styles/tokens.css';

import { Autocomplete } from './Autocomplete';
import * as styles from './Composer.css';

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
	onActiveFacet?: (facet: TapperActiveFacet | null) => void;
	onFacetCommitted?: (facet: TapperFacet) => void;
	onPaste?: (event: ClipboardEvent) => void;
	onRequestSubmit?: (request: SubmitRequest) => void;
	onFocus?: () => void;
	onBlur?: () => void;
};

const NO_PADDING: ContentPadding = { bottom: 0, left: 0, right: 0, top: 0 };

/**
 * Web-native rich composer input: an autosizing `<textarea>` over a facet-colored preview, with inline
 * autocomplete for mentions, hashtags, and emoji. Escape is left to bubble, so a host dialog still closes.
 */
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
	onChange,
	onActiveFacet,
	onFacetCommitted,
	onPaste,
	onRequestSubmit,
	onFocus,
	onBlur,
}: ComposerProps) {
	const tapper = useTapper({
		initialText: defaultValue ?? '',
		facets: ['emoji', 'mention', 'tag', 'url'],
	});
	const [activeFacet, setActiveFacet] = useState<TapperActiveFacet | null>(null);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	// the DOM span of the facet currently being typed; Base UI's Positioner anchors the popup to it.
	const facetAnchorRef = useRef<HTMLElement | null>(null);

	const hasFacet = !!activeFacet && activeFacet.type !== 'url';
	// require at least one character after the trigger (`@m`, not a bare `@`) before querying/opening.
	const hasQuery = hasFacet && activeFacet.value.length > 0;
	const { isFetching, items } = useAutocomplete({
		type: hasFacet ? parseAutocompleteItemType(activeFacet.type) : 'profile',
		query: hasQuery ? activeFacet.value : '',
	});
	// keep the popup open while results load so the spinner has somewhere to show.
	const autocompleteOpen = hasQuery && (items.length > 0 || isFetching);

	const selectItem = (item: AutocompleteItem) => {
		activeFacet?.replace(item.value);
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
				tapper.inputProps.onChangeText('');
			},
			insert: tapper.insert,
		}),
		[tapper.inputProps, tapper.insert],
	);

	// fire onChange after mount (parent already knows the initial value).
	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		onChange?.(tapper.state.text);
	}, [tapper.state.text, onChange]);

	// Tapper events
	const callbackRefs = useRef({ onActiveFacet, onFacetCommitted });
	callbackRefs.current = { onActiveFacet, onFacetCommitted };
	useEffect(() => {
		const offActiveFacet = tapper.on('activeFacet', (facet) => {
			setActiveFacet(facet);
			callbackRefs.current.onActiveFacet?.(facet);
		});
		const offFacetCommitted = tapper.on('facetCommitted', (facet) => {
			callbackRefs.current.onFacetCommitted?.(facet);
		});
		const offAfterInsert = tapper.on('afterInsert', () => {
			tapper.input.focus();
		});
		return () => {
			offActiveFacet();
			offFacetCommitted();
			offAfterInsert();
		};
	}, [tapper.on, tapper.input]);

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

	// stable across renders (both ref callbacks are stable) so the textarea isn't detached/reattached
	// on every keystroke.
	const textareaRefs = useMemo(
		() => mergeRefs([textareaRef, tapper.inputProps.ref as Ref<HTMLTextAreaElement>]),
		[tapper.inputProps.ref],
	);

	return (
		<BaseAutocomplete.Root
			autoHighlight
			items={items}
			// the textarea holds the whole post; the facet substring is the query, so Base UI must not
			// filter or rewrite the value — we drive both ourselves.
			mode="none"
			open={autocompleteOpen}
			onOpenChange={(open) => {
				if (!open) {
					setActiveFacet(null);
				}
			}}
			openOnInputClick={false}
			value={tapper.state.text}
			onValueChange={(value, details) => {
				// route the user's own edits (typing, paste, clear) into Tapper; ignore value changes Base UI
				// emits from picking a row (`item-press`), which we handle via the item's onClick to splice
				// into the facet instead.
				if (details.reason === 'input-change' || details.reason === 'input-clear') {
					tapper.inputProps.onChangeText(value);
				}
			}}
		>
			<div className={clsx(styles.root, className)}>
				<div className={styles.overlay} aria-hidden inert>
					<div className={styles.overlayInner} style={paddingStyle}>
						{tapper.state.nodes.map((node, i) => {
							if (node.type === 'text') {
								return <span key={i}>{node.value}</span>;
							}
							const isActiveFacetSpan =
								!!activeFacet &&
								node.facetType === activeFacet.type &&
								node.start === activeFacet.range.start &&
								node.end === activeFacet.range.end;
							return (
								<span
									key={i}
									ref={(el) => {
										if (isActiveFacetSpan) {
											facetAnchorRef.current = el;
										}
									}}
									// emoji facets exist only to drive autocomplete; render them as plain text.
									className={node.type === 'facet' && node.facetType !== 'emoji' ? styles.facet : undefined}
								>
									{node.raw}
								</span>
							);
						})}
					</div>
				</div>
				<BaseAutocomplete.Input
					// `rows` is textarea-only, so it rides on the render element, not the input-typed props.
					render={<textarea rows={1} />}
					// Base UI types Input for `<input>`; we render a `<textarea>`, so the ref is really a textarea.
					ref={textareaRefs as unknown as Ref<HTMLInputElement>}
					className={styles.textarea}
					style={{ ...paddingStyle, minHeight }}
					placeholder={placeholder}
					aria-label={accessibilityLabel}
					aria-description={accessibilityHint}
					autoFocus={autoFocus}
					onSelect={(e) => {
						const el = e.currentTarget;
						tapper.inputProps.onSelectionChange({
							nativeEvent: { selection: { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 } },
						});
					}}
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
						setActiveFacet(null);
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
					getAnchor={() => facetAnchorRef.current}
					placement={autocompletePlacement}
					onSelect={selectItem}
				/>
			)}
		</BaseAutocomplete.Root>
	);
}
