import type { KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';
import { type LayoutChangeEvent, type StyleProp, View, type ViewStyle } from 'react-native';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { useNavigationDeduped } from '#/lib/hooks/useNavigationDeduped';
import { useOpenLink } from '#/lib/hooks/useOpenLink';

import { onPressInner } from '#/view/com/util/Link';

// elements that handle their own press, plus regions that opt out via {@link noRowLink}; a click landing
// on one must not also navigate the row
const INTERACTIVE_SELECTOR = 'a, button, [role="button"], [role="link"], [data-no-row-link]';

/**
 * Spread onto any element to exempt clicks within it from {@link BlockLink}'s row navigation. For regions that
 * handle their own clicks but aren't semantic links/buttons — media players, embedded iframes. Only catches
 * clicks whose target is inside the element; a click dispatched on an ancestor (e.g. the post body, after a
 * drag that releases outside the region) still navigates.
 */
export const noRowLink = { 'data-no-row-link': '' };

type BlockLinkProps = {
	children: ReactNode;
	href: string;
	/**
	 * When set, the row itself becomes a focusable `role="link"` with this accessible name (Enter activates).
	 * Use it where the row is the only way to reach the target; omit it where inner links already provide
	 * keyboard/AT access (e.g. a feed item's timestamp link), to avoid an extra empty tab stop.
	 */
	label?: string;
	/**
	 * Forwarded to the inner `View` box. {@link GalleryBleed} clones this host to inject a ref and `onLayout`
	 * for its width measurement; without forwarding them the bleed stays unmeasured (width 0, ref null).
	 */
	onLayout?: (e: LayoutChangeEvent) => void;
	ref?: Ref<View>;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onBeforePress?: () => void;
	onPointerEnter?: () => void;
	onPointerLeave?: () => void;
};

/**
 * A web-native clickable post-row region: navigates to `href` when its body is clicked, while letting nested
 * interactive elements and portalled popups (Base UI menus/dialogs) behave normally.
 *
 * The press handler sits on a `display: contents` wrapper so the inner `View` keeps its own box and styles,
 * and it checks DOM containment: a portalled menu item is a React (fiber) descendant of the row but not a DOM
 * descendant, so its bubbling click is ignored here rather than triggering navigation.
 */
export function BlockLink({
	children,
	href,
	label,
	onLayout,
	ref,
	style,
	testID,
	onBeforePress,
	onPointerEnter,
	onPointerLeave,
}: BlockLinkProps) {
	const navigation = useNavigationDeduped();
	const openLink = useOpenLink();

	const go = (e?: MouseEvent<HTMLDivElement>) => {
		onBeforePress?.();
		onPressInner(navigation, sanitizeUrl(href), 'push', openLink, e);
	};

	const onClick = (e: MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement;
		// a portalled popup's click bubbles up the component tree but its DOM node lives elsewhere
		if (!e.currentTarget.contains(target)) {
			return;
		}
		// a nested link/button handles its own press; only a click on the row body should navigate
		const interactive = target.closest(INTERACTIVE_SELECTOR);
		if ((interactive && interactive !== e.currentTarget) || e.defaultPrevented) {
			return;
		}
		go(e);
	};

	// only fires when `label` makes the row a focusable link; activate on Enter when the row itself is focused
	const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Enter' && e.target === e.currentTarget) {
			go();
		}
	};

	// middle-click opens a new tab. mirrors WebAuxClickWrapper: swallow the middle-click autoscroll, then
	// synthesise a meta-click so the same `onClick` path takes over (links handle their own middle-click).
	const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
		if (e.button === 1) {
			e.preventDefault();
		}
	};
	const onMouseUp = (e: MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement;
		if (e.button !== 1 || target.closest('a')) {
			return;
		}
		target.dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }));
	};

	return (
		<div
			style={{ display: 'contents' }}
			role={label ? 'link' : undefined}
			tabIndex={label ? 0 : undefined}
			aria-label={label}
			onClick={onClick}
			onKeyDown={label ? onKeyDown : undefined}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
		>
			<View
				ref={ref}
				testID={testID}
				style={style}
				onLayout={onLayout}
				onPointerEnter={onPointerEnter}
				onPointerLeave={onPointerLeave}
			>
				{children}
			</View>
		</div>
	);
}
