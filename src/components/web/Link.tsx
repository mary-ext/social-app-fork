import {
	type ComponentPropsWithoutRef,
	type MouseEvent,
	type ReactNode,
	type Ref,
	useCallback,
	useMemo,
} from 'react';
import { StackActions } from '@react-navigation/native';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { useNavigationDeduped } from '#/lib/hooks/useNavigationDeduped';
import type { AllNavigatorParams, RouteParams } from '#/lib/routes/types';
import {
	convertBskyAppUrlIfNeeded,
	isExternalUrl,
	linkRequiresWarning,
	safeUrlParse,
} from '#/lib/strings/url-helpers';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import type { TextProps } from '#/components/Text';
import * as textStyles from '#/components/Text.css';
import { Button, type ButtonProps } from '#/components/web/Button';
import * as styles from '#/components/web/Link.css';

import { router } from '#/routes';

// #region hooks

/** The React Navigation `StackAction` a link performs when pressed. */
type LinkAction = 'navigate' | 'push' | 'replace';

/**
 * Click callback shared by both link families. Runs before navigation; return `false` to cancel it (the link
 * suppresses its default action for you). DO NOT navigate from here — that's what `to`/`href` are for.
 */
type LinkOnPress = (e: MouseEvent<HTMLElement>) => false | void;

// the resolved anchor wiring a presentational shell needs, regardless of which family produced it.
type LinkBindings = {
	href: string;
	onClick: (e: MouseEvent<HTMLElement>) => void;
	rel?: string;
	target?: string;
};

// a modified click (middle/aux button or a held modifier) means the user wants the browser's default — open a
// new tab — so the link lets the native `<a href>` handle it instead of intercepting for client-side nav.
const isModifiedClick = (e: MouseEvent<HTMLElement>) =>
	e.altKey || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey;

const useNavigateToPath = () => {
	const navigation = useNavigationDeduped();
	return useCallback(
		(path: string, action: LinkAction) => {
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
		},
		[navigation],
	);
};

const useInternalLink = ({
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
	const onClick = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			if (onPress?.(e) === false) {
				e.preventDefault();
				return;
			}
			if (isModifiedClick(e)) return;
			e.preventDefault();
			navigateToPath(to, action);
		},
		[action, navigateToPath, onPress, to],
	);
	return { href: to, onClick };
};

// shared core for raw-URL links: resolves the anchor href (a bsky.app URL collapses to an in-app route) and
// returns `navigate`, which performs a plain click's default action — in-app navigation for a resolved
// internal href, and nothing for a genuinely external or modified click (the native anchor opens those).
const useExternalNav = (rawHref: string, action: LinkAction) => {
	const navigateToPath = useNavigateToPath();
	// reject dangerous schemes (javascript:, data:, …) up front: an unsafe URL resolves to an empty href.
	const href = useMemo(() => {
		const parsed = safeUrlParse(rawHref);
		return parsed ? convertBskyAppUrlIfNeeded(parsed.href) : '';
	}, [rawHref]);
	const isExternal = isExternalUrl(href);
	const navigate = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			if (isExternal || isModifiedClick(e)) return;
			e.preventDefault();
			navigateToPath(href, action);
		},
		[action, href, isExternal, navigateToPath],
	);
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
	const onClick = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			if (onPress?.(e) === false) {
				e.preventDefault();
				return;
			}
			navigate(e);
		},
		[navigate, onPress],
	);
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
	const { linkWarningDialogControl } = useGlobalDialogsControlContext();
	const onClick = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			if (onPress?.(e) === false) {
				e.preventDefault();
				return;
			}
			if (displayText && isExternal && linkRequiresWarning(href, displayText)) {
				e.preventDefault();
				linkWarningDialogControl.open({ displayText, href });
				return;
			}
			navigate(e);
		},
		[displayText, href, isExternal, linkWarningDialogControl, navigate, onPress],
	);
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
 * A web-native block link to an in-app route: an `<a>` wrapping arbitrary children that navigates through
 * `react-navigation` on a plain click and falls through to a native new-tab on a modified/middle click. To
 * cancel navigation (e.g. to open a dialog instead), return `false` from `onPress`.
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

/**
 * A web-native block link to a raw URL: opens in a new tab, unless the URL resolves to an in-app route (a
 * `bsky.app` link), in which case it navigates internally.
 */
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
 * A web-native inline text link for untrusted content (e.g. a rich-text link facet): like
 * {@link ExternalInlineLinkText}, but because its children are attacker-controlled, it verifies them against
 * the destination and opens the link-warning dialog instead of navigating when they misrepresent it.
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
