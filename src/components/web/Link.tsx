import type { ComponentPropsWithoutRef, MouseEvent, ReactNode, Ref } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { useLink } from '#/components/Link';
import { Button, type ButtonProps } from '#/components/web/Button';
import * as styles from '#/components/web/Link.css';
import type { TextProps } from '#/components/web/Text';
import * as textStyles from '#/components/web/Text.css';

/** The `to` accepted by {@link useLink}: a route path string or a navigator screen/params object. */
type To = Parameters<typeof useLink>[0]['to'];

type LinkNavProps = {
	/** The React Navigation `StackAction` to perform when the link is pressed. */
	action?: 'navigate' | 'push' | 'replace';
	/** Sets the `download` attribute and skips client-side navigation so the browser handles the download. */
	download?: string;
	/**
	 * Callback for when the link is pressed. Prevent default and return `false` to exit early and prevent
	 * navigation. DO NOT navigate from here — that's what `to` is for.
	 */
	onPress?: (e: GestureResponderEvent) => false | void;
	to: To;
};

// resolved anchor attributes shared by both links: external links open in a new tab; a download skips the
// new tab so the browser saves the file in place.
const anchorAttrs = ({ download, isExternal }: { download?: string; isExternal: boolean }) => ({
	download,
	rel: isExternal ? 'noopener noreferrer' : undefined,
	target: download ? undefined : isExternal ? '_blank' : undefined,
});

/** Underline timing for an inline link: `hover` (default), `always`, or `none`. */
export type InlineLinkUnderline = 'always' | 'hover' | 'none';

export type InlineLinkTextProps = LinkNavProps &
	Pick<TextProps, 'align' | 'color' | 'leading' | 'numberOfLines' | 'selectable' | 'size' | 'weight'> &
	// the rest of the anchor attributes pass straight through, so a headless trigger (e.g. a Base UI
	// tooltip) can inject its event handlers, `aria-describedby`, `data-*`, and ref onto the `<a>`.
	Omit<ComponentPropsWithoutRef<'a'>, 'color' | 'download' | 'href' | 'onClick' | 'style'> & {
		children: ReactNode;
		/** Skip the warning shown when external link text doesn't match its href. */
		disableMismatchWarning?: boolean;
		/** Accessible name; becomes the anchor's `aria-label`. */
		label?: string;
		/** Forwarded to the `<a>` so the link can back a headless trigger (e.g. a Base UI tooltip). */
		ref?: Ref<HTMLAnchorElement>;
		/** Underline timing; defaults to `hover`. */
		underline?: InlineLinkUnderline;
	};

/**
 * A web-native inline text link: an `<a>` styled through the text recipe, defaulting to the primary color
 * with an underline on hover/focus. Internal `to` targets navigate through `react-navigation`; external ones
 * open in a new tab.
 */
export function InlineLinkText({
	action = 'push',
	align,
	children,
	className,
	color = 'primary_500',
	disableMismatchWarning,
	download,
	label,
	leading,
	numberOfLines,
	onPress: outerOnPress,
	selectable,
	size,
	to,
	underline = 'hover',
	weight,
	...rest
}: InlineLinkTextProps) {
	const { href, isExternal, onPress } = useLink({
		action,
		disableMismatchWarning,
		displayText: typeof children === 'string' ? children : '',
		onPress: outerOnPress,
		to,
	});
	const clamped = numberOfLines != null;

	// the anchor is itself the text host, so the *Text-must-return-<Text> rule (a React Native concept) doesn't apply
	// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
	return (
		<a
			{...rest}
			aria-label={label}
			className={clsx(
				textStyles.text({ align, color, leading, size, weight }),
				styles.inlineLink({ underline }),
				clamped && textStyles.clamp,
				selectable === true && textStyles.userSelect.text,
				selectable === false && textStyles.userSelect.none,
				className,
			)}
			href={href}
			onClick={
				download
					? undefined
					: (e: MouseEvent<HTMLAnchorElement>) => onPress(e as unknown as GestureResponderEvent)
			}
			style={clamped ? assignInlineVars({ [textStyles.lineClampVar]: String(numberOfLines) }) : undefined}
			{...anchorAttrs({ download, isExternal })}
		>
			{children}
		</a>
	);
}

export type LinkButtonProps = Omit<ButtonProps, 'nativeButton' | 'onClick' | 'render'> & LinkNavProps;

/**
 * A web-native link styled as a {@link Button}: renders an `<a>` so it keeps real anchor semantics
 * (middle/cmd-click to open a new tab, copy link address) while looking and laying out like a button.
 */
export function LinkButton({
	action = 'push',
	children,
	download,
	onPress: outerOnPress,
	to,
	...rest
}: LinkButtonProps) {
	const { href, isExternal, onPress } = useLink({
		action,
		displayText: typeof children === 'string' ? children : '',
		onPress: outerOnPress,
		to,
	});

	return (
		<Button
			{...rest}
			nativeButton={false}
			onClick={download ? undefined : (e) => onPress(e as unknown as GestureResponderEvent)}
			render={<a href={href} {...anchorAttrs({ download, isExternal })} />}
		>
			{children}
		</Button>
	);
}
