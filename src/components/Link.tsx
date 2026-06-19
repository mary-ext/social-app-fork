import { useCallback, useMemo } from 'react';
import {
	type GestureResponderEvent,
	Linking,
	type NativeSyntheticEvent,
	type TargetedEvent,
	type TextStyle,
} from 'react-native';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { type LinkProps as RNLinkProps, StackActions } from '@react-navigation/native';

import { useNavigationDeduped } from '#/lib/hooks/useNavigationDeduped';
import { useOpenLink } from '#/lib/hooks/useOpenLink';
import type { AllNavigatorParams, RouteParams } from '#/lib/routes/types';
import { convertBskyAppUrlIfNeeded, isExternalUrl, isMisleadingLink } from '#/lib/strings/url-helpers';

import { atoms as a, flatten, type TextStyleProp, useTheme } from '#/alf';

import { Button, type ButtonProps } from '#/components/Button';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Text, type TextProps } from '#/components/Typography';

import { router } from '#/routes';

import { useGlobalDialogsControlContext } from './dialogs/Context';

type WebTextStyle = TextStyle & {
	outline?: number;
	textDecorationColor?: TextStyle['color'];
};

type LinkWebProps = {
	dataSet: {
		noUnderline: '1';
	};
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
		dataSet: {
			// default to no underline, apply this ourselves
			noUnderline: '1',
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

/** Only available within a `Link`, since that inherits from `Button`. `InlineLink` provides no context. */
export { useButtonContext as useLinkContext } from '#/components/Button';

type BaseLinkProps = {
	testID?: string;

	to: RNLinkProps<AllNavigatorParams> | string;

	/** The React Navigation `StackAction` to perform when the link is pressed. */
	action?: 'push' | 'replace' | 'navigate';

	/**
	 * If true, will warn the user if the link text does not match the href.
	 *
	 * Note: atm this only works for `InlineLink`s with a string child.
	 */
	disableMismatchWarning?: boolean;

	/**
	 * Callback for when the link is pressed. Prevent default and return `false` to exit early and prevent
	 * navigation.
	 *
	 * DO NOT use this for navigation, that's what the `to` prop is for.
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
	const navigation = useNavigationDeduped();
	const href = useMemo(() => {
		return typeof to === 'string'
			? convertBskyAppUrlIfNeeded(sanitizeUrl(to))
			: to.screen
				? router.matchName(to.screen)?.build(to.params)
				: to.href
					? convertBskyAppUrlIfNeeded(sanitizeUrl(to.href))
					: undefined;
	}, [to]);

	if (!href) {
		throw new Error(
			'Could not resolve screen. Link `to` prop must be a string or an object with `screen` and `params` properties',
		);
	}

	const isExternal = isExternalUrl(href);
	const { linkWarningDialogControl } = useGlobalDialogsControlContext();
	const openLink = useOpenLink();

	const onPress = useCallback(
		(e: GestureResponderEvent) => {
			const exitEarlyIfFalse = outerOnPress?.(e);

			if (exitEarlyIfFalse === false) return;

			const requiresWarning = Boolean(
				!disableMismatchWarning && displayText && isExternal && isMisleadingLink(href, displayText),
			);

			e.preventDefault();

			if (requiresWarning) {
				linkWarningDialogControl.open({
					displayText,
					href,
				});
			} else {
				if (isExternal) {
					void openLink(href);
				} else {
					const shouldOpenInNewTab = shouldClickOpenNewTab(e);

					if (shouldOpenInNewTab || href.startsWith('http') || href.startsWith('mailto')) {
						void openLink(href);
					} else {
						const [screen, params] = router.matchPath(href) as [
							screen: keyof AllNavigatorParams,
							params?: RouteParams,
						];

						if (action === 'push') {
							navigation.dispatch(StackActions.push(screen, params));
						} else if (action === 'replace') {
							navigation.dispatch(StackActions.replace(screen, params));
						} else if (action === 'navigate') {
							// @ts-expect-error not typed
							navigation.navigate(screen, params, { pop: true });
						} else {
							throw Error('Unsupported navigator action.');
						}
					}
				}
			}
		},
		[
			outerOnPress,
			disableMismatchWarning,
			displayText,
			isExternal,
			href,
			openLink,
			action,
			navigation,
			linkWarningDialogControl,
		],
	);

	return {
		isExternal,
		href,
		onPress,
	};
}

export type LinkProps = Omit<BaseLinkProps, 'disableMismatchWarning'> &
	Omit<ButtonProps, 'onPress' | 'disabled'>;

/**
 * A interactive element that renders as a `<a>` tag on the web. On mobile it will translate the `href` to
 * navigator screens and params and dispatch a navigation action.
 *
 * Intended to behave as a web anchor tag. For more complex routing, use a `Button`.
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

/** A barebones version of `InlineLinkText`, for use outside a `react-navigation` context. */
export function SimpleInlineLinkText({
	children,
	to,
	style,
	download,
	selectable,
	label,
	disableUnderline,
	onPress: outerOnPress,
	...rest
}: Omit<InlineLinkProps, 'action' | 'disableMismatchWarning' | 'to'> & {
	to: string;
}) {
	const t = useTheme();
	const { state: interacted, onIn: onInteract, onOut: onInteractOut } = useInteractionState();
	const flattenedStyle = flatten(style) || {};
	const isExternal = isExternalUrl(to);

	let href = to;

	const onPress = (e: GestureResponderEvent) => {
		const exitEarlyIfFalse = outerOnPress?.(e);
		if (exitEarlyIfFalse === false) return;
		void Linking.openURL(href);
	};

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
			onPress={onPress}
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

/**
 * Determines if the click event has a meta key pressed, indicating the user intends to deviate from default
 * behavior.
 */
export function isClickEventWithMetaKey(e: GestureResponderEvent) {
	const event = e as unknown as MouseEvent;
	return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

/** Determines if the web click target is anything other than `_self` */
export function isClickTargetExternal(e: GestureResponderEvent) {
	const event = e as unknown as MouseEvent;
	const el = event.currentTarget as HTMLAnchorElement;
	return el && el.target && el.target !== '_self';
}

/**
 * Determines if a click event has been modified in a way that should indiciate that the user intends to open
 * a new tab. {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}
 */
export function shouldClickOpenNewTab(e: GestureResponderEvent) {
	const event = e as unknown as MouseEvent;
	const isMiddleClick = event.button === 1;
	return isClickEventWithMetaKey(e) || isClickTargetExternal(e) || isMiddleClick;
}
