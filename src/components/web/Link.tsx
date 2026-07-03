import type { ComponentPropsWithoutRef, MouseEvent, ReactNode, Ref } from 'react';

import { StackActions } from '@react-navigation/native';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { useNavigationDeduped } from '#/lib/hooks/useNavigationDeduped';
import type { AllNavigatorParams, RouteParams } from '#/lib/routes/types';
import {
	convertBskyAppUrlIfNeeded,
	getChatInviteCodeFromUrl,
	isMisleadingLink,
	safeUrlParse,
} from '#/lib/strings/url-helpers';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import type { TextProps } from '#/components/Text';
import * as textStyles from '#/components/Text.css';
import { Button, type ButtonProps } from '#/components/web/Button';
import * as styles from '#/components/web/Link.css';

import { router } from '#/routes';

// #region hooks

/** The React Navigation `StackAction` a link performs when pressed. */
type LinkAction = 'navigate' | 'push' | 'replace';

/**
 * click callback run before navigation. return `false` to cancel navigation. do not navigate from this
 * callback.
 */
type LinkOnPress = (e: MouseEvent<HTMLElement>) => false | void;

type LinkBindings = {
	href: string | undefined;
	onClick: (e: MouseEvent<HTMLElement>) => void;
	rel?: string;
	target?: string;
};

/**
 * determines whether a click should defer to the browser's default action (such as opening in a new tab)
 * rather than being intercepted for client-side navigation.
 *
 * @param event the click event to check
 */
export const isModifiedClick = (e: MouseEvent<HTMLElement>) => {
	return e.altKey || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey;
};

/** Returns a function that navigates to an in-app route `path` via the given React Navigation `StackAction`. */
export const useNavigateToPath = () => {
	const navigation = useNavigationDeduped();
	return (path: string, action: LinkAction) => {
		const [screen, params] = router.matchPath(path) as [keyof AllNavigatorParams, RouteParams];
		switch (action) {
			case 'navigate': {
				// @ts-expect-error the deduped navigate signature omits the trailing options arg
				navigation.navigate(screen, params, { pop: true });
				break;
			}
			case 'push': {
				navigation.dispatch(StackActions.push(screen, params));
				break;
			}
			case 'replace': {
				navigation.dispatch(StackActions.replace(screen, params));
				break;
			}
		}
	};
};

/**
 * resolves the href and onClick bindings for an in-app route link without rendering an anchor. this allows
 * non-anchor elements to preserve link semantics (e.g., middle/cmd-click to open in a new tab, plain click to
 * navigate). return false from onPress to cancel navigation.
 */
export const useInternalLink = ({
	action = 'push',
	onPress,
	to,
}: {
	action?: LinkAction;
	onPress?: LinkOnPress;
	to: string;
}): LinkBindings => {
	if (import.meta.env.DEV && (!to.startsWith('/') || to.startsWith('//'))) {
		throw new Error(
			`Internal link \`to\` must be an app route path starting with a single '/'; got ${JSON.stringify(to)}. Use an External* link for raw URLs.`,
		);
	}
	const navigateToPath = useNavigateToPath();
	const onClick = (e: MouseEvent<HTMLElement>) => {
		if (onPress?.(e) === false) {
			e.preventDefault();
			return;
		}
		if (isModifiedClick(e)) return;
		e.preventDefault();
		navigateToPath(to, action);
	};
	return { href: to, onClick };
};

// shared core for raw-URL links: resolves the anchor href (a bsky.app URL collapses to an in-app route) and
// returns `navigate`, which performs a plain click's default action — in-app navigation for a resolved
// internal href, and nothing for a genuinely external or modified click (the native anchor opens those).
const useExternalNav = (rawHref: string, action: LinkAction) => {
	const navigateToPath = useNavigateToPath();
	const { groupChatJoinHandle } = useGlobalDialogsHandleContext();

	const parsed = safeUrlParse(rawHref);
	const href = parsed ? convertBskyAppUrlIfNeeded(parsed.href) : undefined;

	const isExternal = !href?.startsWith('/');

	const navigate = (e: MouseEvent<HTMLElement>) => {
		if (!href || isExternal || isModifiedClick(e)) {
			return;
		}

		e.preventDefault();

		// a group-chat invite opens the join dialog in place rather than navigating to /chat/<code>.
		const chatInviteCode = getChatInviteCodeFromUrl(href);
		if (chatInviteCode) {
			groupChatJoinHandle.openWithPayload({ code: chatInviteCode });
			return;
		}

		navigateToPath(href, action);
	};

	return { href, isExternal, navigate };
};

const useExternalLink = ({
	action = 'push',
	href: rawHref,
	onPress,
}: {
	action?: LinkAction;
	href: string;
	onPress?: LinkOnPress;
}): LinkBindings => {
	const { href, isExternal, navigate } = useExternalNav(rawHref, action);
	const onClick = (e: MouseEvent<HTMLElement>) => {
		if (onPress?.(e) === false) {
			e.preventDefault();
			return;
		}
		navigate(e);
	};
	return {
		href,
		onClick,
		// external links open in a new tab; an `<a>` to a resolved in-app path needs neither.
		rel: isExternal ? 'noopener noreferrer' : undefined,
		target: isExternal ? '_blank' : undefined,
	};
};

// like useExternalLink, but for links whose visible text is untrusted (post content): before navigating it
// verifies the text against the destination and, on a mismatch, opens the warning dialog instead.
const useContentLink = ({
	action = 'push',
	displayText,
	href: rawHref,
	onPress,
}: {
	action?: LinkAction;
	displayText: string;
	href: string;
	onPress?: LinkOnPress;
}): LinkBindings => {
	const { href, isExternal, navigate } = useExternalNav(rawHref, action);
	const { linkWarningDialogHandle } = useGlobalDialogsHandleContext();
	const onClick = (e: MouseEvent<HTMLElement>) => {
		if (onPress?.(e) === false) {
			e.preventDefault();
			return;
		}

		if (!href) {
			return;
		}

		if (displayText && isExternal && isMisleadingLink(href, displayText)) {
			e.preventDefault();
			linkWarningDialogHandle.openWithPayload({ displayText, href });
			return;
		}

		navigate(e);
	};
	return {
		href,
		onClick,
		// external links open in a new tab; an `<a>` to a resolved in-app path needs neither.
		rel: isExternal ? 'noopener noreferrer' : undefined,
		target: isExternal ? '_blank' : undefined,
	};
};

// #endregion

// #region presentational shells

type BlockAnchorProps = Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'onClick' | 'rel' | 'target'> & {
	children: ReactNode;
	/** Accessible name; becomes the anchor's `aria-label`. */
	label?: string;
	/** Forwarded to the `<a>` so the link can back a headless trigger (e.g. a hover card). */
	ref?: Ref<HTMLAnchorElement>;
};

// a block `<a>` wrapping arbitrary children with no styling of its own — pass `className` for layout.
const BlockAnchor = ({
	bindings,
	children,
	label,
	...rest
}: { bindings: LinkBindings } & BlockAnchorProps) => (
	<a
		{...rest}
		aria-label={label}
		href={bindings.href}
		onClick={bindings.onClick}
		rel={bindings.rel}
		target={bindings.target}
	>
		{children}
	</a>
);

/** Underline timing for an inline link: `hover` (default), `always`, or `none`. */
export type InlineLinkUnderline = 'always' | 'hover' | 'none';

type InlineAnchorProps = Pick<
	TextProps,
	'align' | 'color' | 'leading' | 'numberOfLines' | 'selectable' | 'size' | 'weight'
> &
	Omit<ComponentPropsWithoutRef<'a'>, 'color' | 'href' | 'onClick' | 'rel' | 'style' | 'target'> & {
		children: ReactNode;
		/** Accessible name; becomes the anchor's `aria-label`. */
		label?: string;
		/** Forwarded to the `<a>` so the link can back a headless trigger (e.g. a Base UI tooltip). */
		ref?: Ref<HTMLAnchorElement>;
		/** Underline timing; defaults to `hover`. */
		underline?: InlineLinkUnderline;
	};

// an inline text `<a>` styled through the text recipe, defaulting to the primary color with an underline on
// hover/focus.
const InlineAnchor = ({
	align,
	bindings,
	children,
	className,
	color = 'primary_500',
	label,
	leading,
	numberOfLines,
	selectable,
	size,
	underline = 'hover',
	weight,
	...rest
}: { bindings: LinkBindings } & InlineAnchorProps) => {
	const clamped = numberOfLines != null;
	const singleLine = numberOfLines === 1;

	return (
		<a
			{...rest}
			aria-label={label}
			className={clsx(
				textStyles.text({ align, color, leading, size, weight }),
				styles.inlineLink({ underline }),
				clamped && (singleLine ? textStyles.clampSingleLine : textStyles.clampMultiLine),
				selectable === true && textStyles.userSelect.text,
				selectable === false && textStyles.userSelect.none,
				className,
			)}
			href={bindings.href}
			onClick={bindings.onClick}
			rel={bindings.rel}
			style={
				clamped && !singleLine
					? assignInlineVars({ [textStyles.lineClampVar]: String(numberOfLines) })
					: undefined
			}
			target={bindings.target}
		>
			{children}
		</a>
	);
};

type ButtonAnchorProps = Omit<ButtonProps, 'nativeButton' | 'onClick' | 'render'>;

// a {@link Button} that renders an `<a>`, so it keeps real anchor semantics (middle/cmd-click, copy link
// address) while looking and laying out like a button.
const ButtonAnchor = ({ bindings, children, ...rest }: { bindings: LinkBindings } & ButtonAnchorProps) => (
	<Button
		{...rest}
		nativeButton={false}
		onClick={bindings.onClick}
		render={<a href={bindings.href} rel={bindings.rel} target={bindings.target} />}
	>
		{children}
	</Button>
);

// #endregion

// #region internal links — `to` is an in-app route path

type InternalNavProps = {
	/** The React Navigation `StackAction` to perform when the link is pressed. */
	action?: LinkAction;
	onPress?: LinkOnPress;
	/** An in-app route path, e.g. `/profile/alice`. Must start with a single `/`. */
	to: string;
};

export type LinkProps = InternalNavProps & BlockAnchorProps;
export type InlineLinkTextProps = InternalNavProps & InlineAnchorProps;
export type LinkButtonProps = InternalNavProps & ButtonAnchorProps;

/**
 * a block link to an in-app route that navigates using react-navigation on click, falling back to
 * browser-native behavior on modified clicks.
 *
 * @param onPress callback to intercept the navigation; return false to cancel it.
 */
export const Link = ({ action, onPress, to, ...rest }: LinkProps) => {
	const bindings = useInternalLink({ action, onPress, to });
	return <BlockAnchor bindings={bindings} {...rest} />;
};

/** A web-native inline text link to an in-app route, styled through the text recipe. */
export const InlineLinkText = ({ action, onPress, to, ...rest }: InlineLinkTextProps) => {
	const bindings = useInternalLink({ action, onPress, to });
	return <InlineAnchor bindings={bindings} {...rest} />;
};

/** A web-native in-app-route link styled as a {@link Button}; renders an `<a>` so it keeps anchor semantics. */
export const LinkButton = ({ action, onPress, to, ...rest }: LinkButtonProps) => {
	const bindings = useInternalLink({ action, onPress, to });
	return <ButtonAnchor bindings={bindings} {...rest} />;
};

// #endregion

// #region external links — `href` is a raw URL

type ExternalNavProps = {
	/** The React Navigation `StackAction` to perform when an `href` that resolves in-app is pressed. */
	action?: LinkAction;
	/** A raw URL. A `bsky.app` URL is collapsed to its in-app route; anything else opens in a new tab. */
	href: string;
	onPress?: LinkOnPress;
};

export type ExternalLinkProps = ExternalNavProps & BlockAnchorProps;
export type ExternalInlineLinkTextProps = ExternalNavProps & InlineAnchorProps;
export type ExternalLinkButtonProps = ExternalNavProps & ButtonAnchorProps;

/** opens a raw URL in a new tab, or navigates internally if it resolves to an in-app route. */
export const ExternalLink = ({ action, href, onPress, ...rest }: ExternalLinkProps) => {
	const bindings = useExternalLink({ action, href, onPress });
	return <BlockAnchor bindings={bindings} {...rest} />;
};

/** A web-native inline text link to a raw URL, behaving like {@link ExternalLink}. */
export const ExternalInlineLinkText = ({ action, href, onPress, ...rest }: ExternalInlineLinkTextProps) => {
	const bindings = useExternalLink({ action, href, onPress });
	return <InlineAnchor bindings={bindings} {...rest} />;
};

/** A web-native raw-URL link styled as a {@link Button}; renders an `<a>` so it keeps anchor semantics. */
export const ExternalLinkButton = ({ action, href, onPress, ...rest }: ExternalLinkButtonProps) => {
	const bindings = useExternalLink({ action, href, onPress });
	return <ButtonAnchor bindings={bindings} {...rest} />;
};

// #endregion

// #region content links — `href` is a raw URL whose visible text is untrusted

export type ContentLinkTextProps = ExternalNavProps & InlineAnchorProps;

/**
 * an inline text link for untrusted content. behaves like {@link ExternalInlineLinkText}, but verifies
 * attacker-controlled children against the destination URL and opens a link-warning dialog on mismatch.
 */
export const ContentLinkText = ({ action, href, onPress, ...rest }: ContentLinkTextProps) => {
	const bindings = useContentLink({
		action,
		displayText: typeof rest.children === 'string' ? rest.children : '',
		href,
		onPress,
	});
	return <InlineAnchor bindings={bindings} {...rest} />;
};

// #endregion
