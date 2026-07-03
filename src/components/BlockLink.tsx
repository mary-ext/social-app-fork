import {
	cloneElement,
	type HTMLAttributes,
	isValidElement,
	type KeyboardEvent,
	type MouseEvent,
	type PointerEvent,
	type ReactElement,
	type ReactNode,
	type Ref,
	useRef,
} from 'react';

import { clsx } from 'clsx';

import { mergeRefs } from '#/lib/merge-refs';

import { isModifiedClick, useNavigateToPath } from '#/components/web/Link';

// elements that handle their own press, plus regions that opt out via {@link noRowLink}; a click landing
// on one must not also navigate the row
const INTERACTIVE_SELECTOR = 'a, button, [role="button"], [role="link"], [data-no-row-link]';

/**
 * spread onto any element to exempt clicks within it from {@link BlockLink} row navigation. useful for regions
 * that handle their own clicks but are not semantic links or buttons.
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
	 * makes the row a focusable link with the specified accessible name, activated by Enter. omit if inner
	 * links already provide keyboard/AT access to avoid redundant tab stops.
	 */
	label?: string;
	className?: string;
	ref?: Ref<HTMLElement>;
	onBeforePress?: () => void;
	onPointerEnter?: () => void;
	onPointerLeave?: () => void;
};

/**
 * navigates to `to` when its child is clicked, while allowing nested interactive elements and portalled
 * popups to behave normally.
 *
 * clones its single child to attach press behavior, keyboard/AT affordances, and forwarded refs/classnames
 * without rendering a wrapper element.
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
	// where the pointer last went down within the row; read back on click to gate navigation on the press
	// origin rather than the release target
	const pressOriginRef = useRef<HTMLElement | null>(null);

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

	// record where the pointer went down so onClick can consult the press origin. capture phase so a child
	// can't stop it from reaching us first
	const onPointerDownCapture = (e: PointerEvent<HTMLElement>) => {
		pressOriginRef.current = e.target as HTMLElement;
	};

	const onClick = (e: MouseEvent<HTMLElement>) => {
		const target = e.target as HTMLElement;
		// a portalled popup's click bubbles up the component tree but its DOM node lives elsewhere
		if (!e.currentTarget.contains(target)) {
			return;
		}
		// the browser fires `click` on the nearest common ancestor of the press and release nodes, so a drag
		// that begins on an interactive sub-region (an image-carousel tile, a button) and releases on the row
		// body yields a row-targeted click that slips past the target check below. gate on the press origin too.
		const origin = pressOriginRef.current;
		const originInteractive = origin?.closest(INTERACTIVE_SELECTOR);
		if (originInteractive && originInteractive !== e.currentTarget) {
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

	// cloneElement's props include a merged ref (forwarded ref + child's own ref). mergeRefs returns a ref
	// callback that reads/writes .current only at attach time, not during render — the rule can't prove that,
	// hence the suppressions on both the call and the ref prop.
	// eslint-disable-next-line react-hooks/refs
	return cloneElement(node, {
		'aria-label': label,
		className: clsx(node.props.className, className),
		onClick,
		onKeyDown: label ? onKeyDown : undefined,
		onMouseDown,
		onMouseUp,
		onPointerDownCapture,
		onPointerEnter,
		onPointerLeave,
		// eslint-disable-next-line react-hooks/refs
		ref: mergeRefs([ref, node.props.ref]),
		role: label ? 'link' : undefined,
		tabIndex: label ? 0 : undefined,
	});
}
