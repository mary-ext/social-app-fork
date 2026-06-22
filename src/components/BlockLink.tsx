import {
	cloneElement,
	type HTMLAttributes,
	isValidElement,
	type KeyboardEvent,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
	type Ref,
} from 'react';
import { clsx } from 'clsx';

import { mergeRefs } from '#/lib/merge-refs';

import { isModifiedClick, useNavigateToPath } from '#/components/web/Link';

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

type BlockLinkChildProps = HTMLAttributes<HTMLElement> & {
	ref?: Ref<HTMLElement>;
};

type BlockLinkProps = {
	/** The single host element to make clickable; its own box becomes the row. */
	children: ReactNode;
	/** An in-app route path, e.g. `/profile/alice/post/abc`. Must start with a single `/`. */
	to: string;
	/**
	 * When set, the row itself becomes a focusable `role="link"` with this accessible name (Enter activates).
	 * Use it where the row is the only way to reach the target; omit it where inner links already provide
	 * keyboard/AT access (e.g. a feed item's timestamp link), to avoid an extra empty tab stop.
	 */
	label?: string;
	className?: string;
	ref?: Ref<HTMLElement>;
	onBeforePress?: () => void;
	onPointerEnter?: () => void;
	onPointerLeave?: () => void;
};

/**
 * A web-native clickable post-row region: navigates to `to` when its body is clicked, while letting nested
 * interactive elements and portalled popups (Base UI menus/dialogs) behave normally.
 *
 * Renders no element of its own — it clones its single child (which must be a DOM element) and attaches the
 * press behavior, keyboard/AT affordances, and forwarded ref/className directly to it, so the child's own box
 * is the row. The click handler checks DOM containment: a portalled menu item is a React (fiber) descendant
 * of the row but not a DOM descendant, so its bubbling click is ignored here rather than triggering
 * navigation.
 */
export function BlockLink({
	children,
	to,
	label,
	className,
	ref,
	onBeforePress,
	onPointerEnter,
	onPointerLeave,
}: BlockLinkProps) {
	const navigateToPath = useNavigateToPath();

	if (import.meta.env.DEV && (!to.startsWith('/') || to.startsWith('//'))) {
		throw new Error(
			`BlockLink \`to\` must be an app route path starting with a single '/'; got ${JSON.stringify(to)}.`,
		);
	}

	const go = (e?: MouseEvent<HTMLElement>) => {
		onBeforePress?.();
		// a modified/middle click opens the route in a new same-origin tab (no native `<a>` to fall through to);
		// a plain click navigates in place
		if (e && isModifiedClick(e)) {
			window.open(to, '_blank');
			return;
		}
		navigateToPath(to, 'push');
	};

	const onClick = (e: MouseEvent<HTMLElement>) => {
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
		// the click ending a drag-to-select gesture lands here; don't navigate while the user is selecting text
		const selection = window.getSelection();
		if (selection && !selection.isCollapsed && e.currentTarget.contains(selection.anchorNode)) {
			return;
		}
		go(e);
	};

	// only fires when `label` makes the row a focusable link; activate on Enter when the row itself is focused
	const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
		if (e.key === 'Enter' && e.target === e.currentTarget) {
			go();
		}
	};

	// middle-click opens a new tab. mirrors WebAuxClickWrapper: swallow the middle-click autoscroll, then
	// synthesise a meta-click so the same `onClick` path takes over (links handle their own middle-click).
	const onMouseDown = (e: MouseEvent<HTMLElement>) => {
		if (e.button === 1) {
			e.preventDefault();
		}
	};
	const onMouseUp = (e: MouseEvent<HTMLElement>) => {
		const target = e.target as HTMLElement;
		if (e.button !== 1 || target.closest('a')) {
			return;
		}
		target.dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }));
	};

	if (!isValidElement(children)) {
		throw new Error('BlockLink children must be a single React element');
	}

	const node = children as ReactElement<BlockLinkChildProps>;

	return cloneElement(node, {
		'aria-label': label,
		className: clsx(node.props.className, className),
		onClick,
		onKeyDown: label ? onKeyDown : undefined,
		onMouseDown,
		onMouseUp,
		onPointerEnter,
		onPointerLeave,
		ref: mergeRefs([ref, node.props.ref]),
		role: label ? 'link' : undefined,
		tabIndex: label ? 0 : undefined,
	});
}
