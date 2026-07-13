import type { JSX } from 'react';
import {
	type GestureResponderEvent,
	Pressable,
	type StyleProp,
	type TextProps,
	type TextStyle,
	type TouchableOpacity,
	View,
	type ViewStyle,
} from 'react-native';

import { sanitizeUrl } from '@braintree/sanitize-url';

import { useOpenLink } from '#/lib/hooks/useOpenLink';
import {
	type NavigateAction,
	type NavigateToPath,
	useActiveMatch,
	useNavigateToPath,
} from '#/lib/navigation';
import { convertBskyAppUrlIfNeeded, isExternalUrl, isMisleadingLink } from '#/lib/strings/url-helpers';
import type { TypographyVariant } from '#/lib/ThemeContext';

import { softReset } from '#/state/events';

import { WebAuxClickWrapper } from '#/view/com/util/WebAuxClickWrapper';

import { useTheme } from '#/alf';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';

import { router } from '../../../routes';
import { PressableWithHover } from './PressableWithHover';
import { Text } from './text/Text';

type Event = React.MouseEvent<HTMLAnchorElement> | GestureResponderEvent;
type DataSet = Record<string, string | number | undefined>;

const compactDataSet = (dataSet: DataSet | undefined): Record<string, string | number> | undefined => {
	if (!dataSet) {
		return undefined;
	}
	return Object.fromEntries(
		Object.entries(dataSet).filter((entry): entry is [string, string | number] => {
			return entry[1] !== undefined;
		}),
	);
};

interface Props extends React.ComponentProps<typeof TouchableOpacity> {
	testID?: string;
	style?: StyleProp<ViewStyle>;
	href?: string;
	title?: string;
	children?: React.ReactNode;
	hoverStyle?: StyleProp<ViewStyle>;
	noFeedback?: boolean;
	asAnchor?: boolean;
	dataSet?: DataSet;
	navigationAction?: 'push' | 'replace' | 'navigate';
	onPointerEnter?: () => void;
	onPointerLeave?: () => void;
	onBeforePress?: () => void;
}

/** @deprecated use Link from `#/components/Link.tsx` instead */
export function Link({
	testID,
	style,
	href,
	title,
	children,
	noFeedback,
	asAnchor,
	accessible,
	navigationAction,
	onBeforePress,
	accessibilityActions,
	onAccessibilityAction,
	dataSet: dataSetProp,
	...props
}: Props) {
	const t = useTheme();
	const navigate = useLinkNavigate();
	const anchorHref = asAnchor ? sanitizeUrl(href) : undefined;
	const openLink = useOpenLink();

	const onPress = (e?: Event) => {
		onBeforePress?.();
		if (typeof href === 'string') {
			return onPressInner(navigate, sanitizeUrl(href), navigationAction, (url) => openLink(url), e);
		}
	};

	const accessibilityActionsWithActivate = [
		...(accessibilityActions || []),
		{ name: 'activate', label: title },
	];

	const dataSet = compactDataSet(dataSetProp);

	if (noFeedback) {
		return (
			<WebAuxClickWrapper>
				<Pressable
					testID={testID}
					onPress={onPress}
					accessible={accessible}
					accessibilityRole="link"
					accessibilityActions={accessibilityActionsWithActivate}
					onAccessibilityAction={(e) => {
						if (e.nativeEvent.actionName === 'activate') {
							onPress();
						} else {
							onAccessibilityAction?.(e);
						}
					}}
					// @ts-ignore web only -sfn
					dataSet={dataSet}
					{...props}
					android_ripple={{
						color: t.atoms.bg_contrast_25.backgroundColor,
					}}
				>
					{/* @ts-ignore web only -prf */}
					<View style={style} href={anchorHref}>
						{children ? children : <Text>{title || 'link'}</Text>}
					</View>
				</Pressable>
			</WebAuxClickWrapper>
		);
	}

	const Com = props.hoverStyle ? PressableWithHover : Pressable;
	return (
		<Com
			testID={testID}
			style={style}
			onPress={onPress}
			accessible={accessible}
			accessibilityRole="link"
			accessibilityLabel={props.accessibilityLabel ?? title}
			accessibilityHint={props.accessibilityHint}
			// @ts-ignore web only -prf
			href={anchorHref}
			dataSet={dataSet}
			{...props}
		>
			{children ? children : <Text>{title || 'link'}</Text>}
		</Com>
	);
}

/** @deprecated use InlineLinkText from `#/components/Link.tsx` instead */
export function TextLink({
	testID,
	type = 'md',
	style,
	href,
	text,
	numberOfLines,
	lineHeight,
	dataSet: dataSetProp,
	onPress: onPressProp,
	onBeforePress,
	disableMismatchWarning,
	navigationAction,
	...props
}: {
	testID?: string;
	type?: TypographyVariant;
	style?: StyleProp<TextStyle>;
	href: string;
	text: string | JSX.Element | React.ReactNode;
	numberOfLines?: number;
	lineHeight?: number;
	dataSet?: DataSet;
	disableMismatchWarning?: boolean;
	navigationAction?: 'push' | 'replace' | 'navigate';
	onBeforePress?: () => void;
} & TextProps) {
	const navigate = useLinkNavigate();
	const { linkWarningDialogHandle } = useGlobalDialogsHandleContext();
	const openLink = useOpenLink();

	if (!disableMismatchWarning && typeof text !== 'string') {
		console.error('Unable to detect mismatching label');
	}

	const dataSet = compactDataSet(dataSetProp);

	const onPress = (e?: Event) => {
		const requiresWarning =
			!disableMismatchWarning && isMisleadingLink(href, typeof text === 'string' ? text : '');
		if (requiresWarning) {
			e?.preventDefault?.();
			linkWarningDialogHandle.openWithPayload({
				displayText: typeof text === 'string' ? text : '',
				href,
			});
		}
		if (href !== '#' && e != null && isModifiedEvent(e as React.MouseEvent)) {
			// Let the browser handle opening in new tab etc.
			return;
		}
		onBeforePress?.();
		if (onPressProp) {
			e?.preventDefault?.();
			// @ts-expect-error function signature differs by platform -prf
			return onPressProp();
		}
		return onPressInner(navigate, sanitizeUrl(href), navigationAction, (url) => openLink(url), e);
	};
	const isExternal = isExternalUrl(href);
	const hrefAttrs = isExternal
		? {
				target: '_blank',
				// rel: 'noopener noreferrer',
			}
		: {};

	return (
		<Text
			testID={testID}
			type={type}
			style={style}
			numberOfLines={numberOfLines}
			lineHeight={lineHeight}
			dataSet={dataSet}
			// @ts-ignore web only -prf
			hrefAttrs={hrefAttrs} // hack to get open in new tab to work on safari. without this, safari will open in a new window
			onPress={onPress}
			accessibilityRole="link"
			href={convertBskyAppUrlIfNeeded(sanitizeUrl(href))}
			{...props}
		>
			{text}
		</Text>
	);
}

const EXEMPT_PATHS = ['/robots.txt', '/security.txt', '/.well-known/'];

/**
 * a `navigate` link pointing at the screen the app is already showing scrolls that screen back to the top
 * instead of navigating to a second copy of it. this is what the nav rails do.
 */
function useLinkNavigate(): NavigateToPath {
	const navigateToPath = useNavigateToPath();
	const activeMatch = useActiveMatch();

	return (path, action) => {
		if (action === 'navigate' && router.matchPath(path)[0] === activeMatch.name) {
			softReset.emit();
			return;
		}

		navigateToPath(path, action);
	};
}

// NOTE
// we can't use the onPress given by useLinkProps because it will
// match most paths to the HomeTab routes while we actually want to
// preserve the tab the app is currently in
//
// we also have some additional behaviors - closing the current modal,
// converting bsky urls, and opening http/s links in the system browser
//
// this method copies from the onPress implementation but adds our
// needed customizations
// -prf
function onPressInner(
	navigate: NavigateToPath,
	href: string,
	navigationAction: NavigateAction = 'push',
	openLink: (href: string) => void,
	e?: unknown,
) {
	const event = e as
		| {
				altKey?: boolean;
				button?: number | null;
				ctrlKey?: boolean;
				currentTarget?: { target?: string | null };
				defaultPrevented?: boolean;
				metaKey?: boolean;
				preventDefault?: () => void;
				shiftKey?: boolean;
		  }
		| undefined;
	let shouldHandle = false;
	const isLeftClick = event?.button == null || event.button === 0;
	const isMiddleClick = event?.button === 1;
	const isMetaKey = event?.metaKey || event?.altKey || event?.ctrlKey || event?.shiftKey;
	const newTab = isMetaKey || isMiddleClick;

	if (!event) {
		shouldHandle = true;
	} else if (
		!event.defaultPrevented && // onPress prevented default
		(isLeftClick || isMiddleClick) && // ignore everything but left and middle clicks
		[undefined, null, '', 'self'].includes(event.currentTarget?.target) // let browser handle "target=_blank" etc.
	) {
		event.preventDefault?.();
		shouldHandle = true;
	}

	if (shouldHandle) {
		href = convertBskyAppUrlIfNeeded(href);
		if (
			newTab ||
			href.startsWith('http') ||
			href.startsWith('mailto') ||
			EXEMPT_PATHS.some((path) => href.startsWith(path))
		) {
			openLink(href);
		} else {
			navigate(href, navigationAction);
		}
	}
}

function isModifiedEvent(e: React.MouseEvent): boolean {
	const eventTarget = e.currentTarget as HTMLAnchorElement;
	const target = eventTarget.getAttribute('target');
	return (
		(target && target !== '_self') ||
		e.metaKey ||
		e.ctrlKey ||
		e.shiftKey ||
		e.altKey ||
		(e.nativeEvent && e.nativeEvent.which === 2)
	);
}
