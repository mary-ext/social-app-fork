import type { GestureResponderEvent, NativeSyntheticEvent, TargetedEvent, TextStyle } from 'react-native';

import { sanitizeUrl } from '@braintree/sanitize-url';

import { convertBskyAppUrlIfNeeded, isExternalUrl, isMisleadingLink } from '#/lib/strings/url-helpers';

import { atoms as a, flatten, type TextStyleProp, useTheme } from '#/alf';

import { Button, type ButtonProps } from '#/components/Button';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Text, type TextProps } from '#/components/Typography';

import { useRouter } from '#/routes';

import { useGlobalDialogsHandleContext } from './dialogs/Context';

type WebTextStyle = TextStyle & {
	outline?: number;
	textDecorationColor?: TextStyle['color'];
};

type LinkWebProps = {
	href: string;
	hrefAttrs: {
		download?: string;
		rel?: string;
		target?: string;
	};
	onBlur?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
	onFocus?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
};

const webLinkProps = ({
	download,
	href,
	isExternal,
	onBlur,
	onFocus,
	onMouseEnter,
	onMouseLeave,
}: {
	download?: string;
	href: string;
	isExternal: boolean;
	onBlur?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
	onFocus?: (e: NativeSyntheticEvent<TargetedEvent>) => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
}): LinkWebProps => {
	return {
		href,
		hrefAttrs: {
			target: download ? undefined : isExternal ? 'blank' : undefined,
			rel: isExternal ? 'noopener noreferrer' : undefined,
			download,
		},
		onBlur,
		onFocus,
		onMouseEnter,
		onMouseLeave,
	};
};

const underlineStyle = (color: TextStyle['color']): WebTextStyle => {
	return {
		outline: 0,
		textDecorationLine: 'underline',
		textDecorationColor: color,
	};
};

type BaseLinkProps = {
	testID?: string;

	to: string;

	/** how the link navigates when pressed: `replace` swaps the current entry; `push` and `navigate` both push. */
	action?: 'push' | 'replace' | 'navigate';

	/** warns the user if the link text does not match the href. only works for string children. */
	disableMismatchWarning?: boolean;

	/**
	 * callback when the link is pressed. return `false` to prevent navigation.
	 *
	 * do not use this for navigation (use the `to` prop instead).
	 *
	 * @param event the press event
	 */
	onPress?: (e: GestureResponderEvent) => void | false;

	/** Web-only attribute. Sets `download` attr on web. */
	download?: string;

	/** Whether the link should be opened through the redirect proxy. */
	shouldProxy?: boolean;

	/** Web only */
	onMouseEnter?: () => void;

	/** Web only */
	onMouseLeave?: () => void;
};

export function useLink({
	to,
	displayText,
	action = 'push',
	disableMismatchWarning,
	onPress: outerOnPress,
}: BaseLinkProps & {
	displayText: string;
}) {
	const router = useRouter();
	const href = convertBskyAppUrlIfNeeded(sanitizeUrl(to));

	const isExternal = isExternalUrl(href);
	const { linkWarningDialogHandle } = useGlobalDialogsHandleContext();

	const onPress = (e: GestureResponderEvent) => {
		const exitEarlyIfFalse = outerOnPress?.(e);

		if (exitEarlyIfFalse === false) return;

		const requiresWarning = Boolean(
			!disableMismatchWarning && displayText && isExternal && isMisleadingLink(href, displayText),
		);

		e.preventDefault();

		if (requiresWarning) {
			linkWarningDialogHandle.openWithPayload({
				displayText,
				href,
			});
		} else {
			if (isExternal) {
				window.open(href, '_blank', 'noopener');
			} else {
				const shouldOpenInNewTab = shouldClickOpenNewTab(e);

				if (shouldOpenInNewTab || href.startsWith('http') || href.startsWith('mailto')) {
					window.open(href, '_blank', 'noopener');
				} else if (action === 'replace') {
					router.replace(href);
				} else {
					// push + navigate: stacker pushes the URL; singleton routes dedupe on their own.
					router.push(href);
				}
			}
		}
	};

	return {
		isExternal,
		href,
		onPress,
	};
}

export type LinkProps = Omit<BaseLinkProps, 'disableMismatchWarning'> &
	Omit<ButtonProps, 'onPress' | 'disabled'>;

/**
 * an interactive element that renders as an `<a>` tag on the web, and translates the `href` to native
 * navigation screens and params on mobile.
 *
 * intended to behave as a web anchor tag. for more complex routing, use a `Button`.
 */
export function Link({
	children,
	to,
	action = 'push',
	onPress: outerOnPress,
	download,
	shouldProxy,
	onMouseEnter,
	onMouseLeave,
	...rest
}: LinkProps) {
	const { href, isExternal, onPress } = useLink({
		to,
		displayText: typeof children === 'string' ? children : '',
		action,
		onPress: outerOnPress,
		shouldProxy,
	});

	return (
		<Button
			{...rest}
			style={[a.justify_start, rest.style]}
			role="link"
			accessibilityRole="link"
			onPress={download ? undefined : onPress}
			{...webLinkProps({ download, href, isExternal, onMouseEnter, onMouseLeave })}
		>
			{children}
		</Button>
	);
}

export type InlineLinkProps = React.PropsWithChildren<
	BaseLinkProps &
		TextStyleProp &
		Pick<TextProps, 'selectable' | 'numberOfLines' | 'emoji'> &
		Pick<ButtonProps, 'label' | 'accessibilityHint' | 'onFocus' | 'onBlur'> & {
			disableUnderline?: boolean;
		}
>;

export function InlineLinkText({
	children,
	to,
	action = 'push',
	disableMismatchWarning,
	style,
	onPress: outerOnPress,
	download,
	selectable,
	label,
	disableUnderline,
	...rest
}: InlineLinkProps) {
	const t = useTheme();
	const stringChildren = typeof children === 'string';
	const { href, isExternal, onPress } = useLink({
		to,
		displayText: stringChildren ? children : '',
		action,
		disableMismatchWarning,
		onPress: outerOnPress,
	});
	const { state: interacted, onIn: onInteract, onOut: onInteractOut } = useInteractionState();
	const flattenedStyle = flatten(style) || {};

	return (
		<Text
			selectable={selectable}
			accessibilityHint=""
			accessibilityLabel={label}
			{...rest}
			style={[
				{ color: t.palette.primary_500 },
				interacted && !disableUnderline && underlineStyle(flattenedStyle.color ?? t.palette.primary_500),
				flattenedStyle,
			]}
			role="link"
			onPress={download ? undefined : onPress}
			accessibilityRole="link"
			{...webLinkProps({
				download,
				href,
				isExternal,
				onMouseEnter: () => {
					rest.onMouseEnter?.();
					onInteract();
				},
				onMouseLeave: () => {
					rest.onMouseLeave?.();
					onInteractOut();
				},
				onFocus: (e: NativeSyntheticEvent<TargetedEvent>) => {
					rest.onFocus?.(e);
					onInteract();
				},
				onBlur: (e: NativeSyntheticEvent<TargetedEvent>) => {
					rest.onBlur?.(e);
					onInteractOut();
				},
			})}
		>
			{children}
		</Text>
	);
}

/**
 * Utility to create a static `onPress` handler for a `Link` that would otherwise link to a URI
 *
 * Example: `<Link {...createStaticClick(e => {...})} />`
 */
export function createStaticClick(onPressHandler: Exclude<BaseLinkProps['onPress'], undefined>): {
	to: string;
	onPress: Exclude<BaseLinkProps['onPress'], undefined>;
} {
	return {
		to: '#',
		onPress(e: GestureResponderEvent) {
			e.preventDefault();
			onPressHandler(e);
			return false;
		},
	};
}

const asMouseEvent = (e: GestureResponderEvent) => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- RNW forwards the underlying DOM mouse event
	return e as unknown as MouseEvent;
};

/**
 * Determines if the click event has a meta key pressed, indicating the user intends to deviate from default
 * behavior.
 */
export function isClickEventWithMetaKey(e: GestureResponderEvent) {
	const event = asMouseEvent(e);
	return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

/** Determines if the web click target is anything other than `_self` */
export function isClickTargetExternal(e: GestureResponderEvent) {
	const el = asMouseEvent(e).currentTarget;
	return el instanceof HTMLAnchorElement && !!el.target && el.target !== '_self';
}

/**
 * Determines if a click event has been modified in a way that should indiciate that the user intends to open
 * a new tab. {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}
 */
export function shouldClickOpenNewTab(e: GestureResponderEvent) {
	const isMiddleClick = asMouseEvent(e).button === 1;
	return isClickEventWithMetaKey(e) || isClickTargetExternal(e) || isMiddleClick;
}
