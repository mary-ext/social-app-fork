import {
	type CSSProperties,
	type Ref,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { clsx } from 'clsx';

import { mergeRefs } from '#/lib/merge-refs';
import { type Placement, useSift } from '#/lib/sift';
import { type TapperActiveFacet, type TapperFacet, useTapper } from '#/lib/tapper';

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
 * insert at cursor, anchor the autocomplete).
 */
export type ComposerInternalApi = {
	input?: {
		element: HTMLTextAreaElement | null;
		focus: () => void;
		blur: () => void;
	};
	clear: () => void;
	insert: (text: string) => void;
	setAutocompleteAnchor: (node: Element | null) => void;
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
	disableEmojiFacets?: boolean;
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
 * Web-native rich composer input: a transparent autosizing `<textarea>` over a facet-colored preview. Built
 * on the platform-neutral Tapper (text model) + Sift (autocomplete positioning). keydown bubbling (Escape →
 * dialog close) is not suppressed.
 */
export function Composer({
	placeholder,
	defaultValue,
	autoFocus,
	minRows = 2,
	contentPadding = NO_PADDING,
	className,
	disableEmojiFacets = false,
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
		facets: disableEmojiFacets ? ['mention', 'tag', 'url'] : ['emoji', 'mention', 'tag', 'url'],
	});
	const sift = useSift({
		offset: 8,
		placement: autocompletePlacement,
		dynamicWidth: true,
	});

	const [activeFacet, setActiveFacet] = useState<TapperActiveFacet | null>(null);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const overlayInnerRef = useRef<HTMLDivElement>(null);

	const resize = () => {
		const el = textareaRef.current;
		if (!el) {
			return;
		}
		// collapse first so `scrollHeight` reflects the content; the CSS `minHeight` floors the result.
		el.style.height = '0px';
		el.style.height = `${Math.ceil(el.scrollHeight)}px`;
		void sift.updatePosition();
	};

	// resize once the textarea is mounted, whenever the value is set externally (e.g. drafts), and whenever
	// `minRows` changes (e.g. a post going inactive shrinks from the expanded min-height) — otherwise the
	// stale inline height from the previous min sticks.
	useEffect(() => {
		resize();
	}, [tapper.state.text, minRows]); // eslint-disable-line react-hooks/exhaustive-deps

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
				if (overlayInnerRef.current) {
					overlayInnerRef.current.style.transform = 'translateY(0px)';
				}
			},
			insert: tapper.insert,
			setAutocompleteAnchor: sift.refs.setAnchor,
		}),
		[tapper.inputProps, tapper.insert, sift.refs.setAnchor],
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

	// stable across renders (all three ref callbacks are stable) so the textarea isn't detached/reattached
	// on every keystroke.
	const textareaRefs = useMemo(
		() =>
			mergeRefs([
				textareaRef,
				tapper.inputProps.ref as Ref<HTMLTextAreaElement>,
				sift.targetProps.ref as Ref<HTMLTextAreaElement>,
			]),
		[tapper.inputProps.ref, sift.targetProps.ref],
	);

	return (
		<>
			<div className={clsx(styles.root, className)}>
				<div className={styles.overlay} aria-hidden inert>
					<div ref={overlayInnerRef} className={styles.overlayInner} style={paddingStyle}>
						{tapper.state.nodes.map((node, i) => {
							if (node.type === 'text') {
								return <span key={i}>{node.value}</span>;
							}
							return (
								<span
									key={i}
									ref={sift.refs.setAnchor}
									className={node.type === 'facet' ? styles.facet : undefined}
								>
									{node.raw}
								</span>
							);
						})}
					</div>
				</div>
				<textarea
					{...sift.targetProps}
					ref={textareaRefs}
					className={styles.textarea}
					style={{ ...paddingStyle, minHeight }}
					value={tapper.state.text}
					placeholder={placeholder}
					rows={1}
					aria-label={accessibilityLabel}
					aria-description={accessibilityHint}
					autoFocus={autoFocus}
					onChange={(e) => {
						tapper.inputProps.onChangeText(e.target.value);
						resize();
					}}
					onSelect={(e) => {
						const el = e.currentTarget;
						tapper.inputProps.onSelectionChange({
							nativeEvent: { selection: { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 } },
						});
					}}
					onScroll={(e) => {
						if (overlayInnerRef.current) {
							overlayInnerRef.current.style.transform = `translateY(${-e.currentTarget.scrollTop}px)`;
						}
					}}
					onKeyDown={(e) => {
						if (isComposing.current) {
							return;
						}
						// Safari fires a final IME-commit "Enter" with keyCode 229; ignore it.
						if (e.key === 'Enter' && e.keyCode === 229) {
							return;
						}
						if (e.key === 'Enter') {
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
			{activeFacet && activeFacet.type !== 'url' && (
				<Autocomplete
					inverted={autocompletePlacement?.startsWith('top')}
					sift={sift}
					activeFacet={activeFacet}
					onDismiss={() => setActiveFacet(null)}
				/>
			)}
		</>
	);
}
